// utils/plannerAlgorithm.js

const generateStudyPlan = (tasks, dailyStudyHours = 4,maxSessionHours=3.5) => {
  // STEP 1: Filter pending tasks with remaining hours
  const pendingTasks = tasks.filter(
    task => task.status !== 'completed' && (task.estimatedHours - (task.actualHours || 0)) > 0
  );

  if (pendingTasks.length === 0) {
    return {
      schedule: [],
      warnings: [],
      message: "No pending tasks found. Add some tasks to generate a study plan!",
      totalDays: 0,
      generatedAt: new Date().toISOString()
    };
  }

  // STEP 2: Sort tasks (priority desc, then deadline asc)
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const prioDiff = priorityWeight[b.priority || 'medium'] - priorityWeight[a.priority || 'medium'];
    if (prioDiff !== 0) return prioDiff;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // STEP 3: Generate warnings (overdue + urgent)
  const warnings = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  sortedTasks.forEach(task => {
    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadline - today) / (86400000)); // ms per day

    if (daysLeft < 0) {
      warnings.push({
        taskId: task._id,
        taskTitle: task.title,
        type: 'overdue',
        daysOverdue: Math.abs(daysLeft),
        message: `⚠️ "${task.title}" is overdue by ${Math.abs(daysLeft)} day(s)!`
      });
    } else if (daysLeft <= 2) {
      warnings.push({
        taskId: task._id,
        taskTitle: task.title,
        type: 'urgent',
        daysLeft,
        message: `🚨 "${task.title}" due in ${daysLeft} day(s) — prioritize!`
      });
    }
  });

  // STEP 4: Prepare task queue with remaining hours
  const taskQueue = sortedTasks.map(task => ({
    taskId: task._id,
    title: task.title,
    subject: task.subject?._id ? task.subject._id.toString() : null,
    subjectColor: task.subject?.color || '#6c757d',
    priority: task.priority || 'medium',
    deadline: task.deadline,
    remainingHours: task.estimatedHours - (task.actualHours || 0)
  }));

  // STEP 5: Build schedule
  const schedule = [];
  let currentDate = new Date(today);
  let safetyCounter = 0;
  const maxDays = 90; // safety limit

  let totalPlannedHours = 0;

  while (taskQueue.some(t => t.remainingHours > 0) && safetyCounter < maxDays) {
    const daySchedule = {
      date: currentDate.toISOString().split('T')[0],
      dayName: getDayName(currentDate),
      sessions: [],
      totalHours: 0,
      breakMessage: null
    };

    let hoursLeftToday = dailyStudyHours;

    // Sort queue for this day: urgent/closest deadline first
    taskQueue.sort((a, b) => {
      const deadlineA = new Date(a.deadline).getTime();
      const deadlineB = new Date(b.deadline).getTime();
      if (deadlineA !== deadlineB) return deadlineA - deadlineB;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    for (let i = 0; i < taskQueue.length && hoursLeftToday > 0; i++) {
      const task = taskQueue[i];
      if (task.remainingHours <= 0) continue;

      const taskDeadline = new Date(task.deadline);
      if (currentDate > taskDeadline) continue; // skip if past deadline

      const assign = Math.min(task.remainingHours, hoursLeftToday, maxSessionHours , 9); // cap per session \~3.5h

      if (assign > 0) {
        daySchedule.sessions.push({
          taskId: task.taskId,
          title: task.title,
          subject: task.subject,
          subjectColor: task.subjectColor,
          priority: task.priority,
          deadline: task.deadline,
          hoursToStudy: Math.round(assign * 10) / 10
        });

        task.remainingHours -= assign;
        hoursLeftToday -= assign;
        daySchedule.totalHours += assign;
        totalPlannedHours += assign;
      }
    }

    // Add break if meaningful study day
    if (daySchedule.totalHours >= 4) {
      daySchedule.breakMessage = "🌟 Great effort today! Take a short break — rest boosts retention.";
    }

    // Add day only if sessions exist
    if (daySchedule.sessions.length > 0) {
      schedule.push(daySchedule);
    }

    currentDate.setDate(currentDate.getDate() + 1);
    safetyCounter++;
  }

  // Final message
  const message = schedule.length > 0
    ? `📚 Plan ready! \( {schedule.length} study days ahead ( \){Math.round(totalPlannedHours)} total hours).`
    : "All tasks scheduled — you're on track!";

  return {
    schedule,
    warnings,
    totalDays: schedule.length,
    dailyStudyHours,
    totalPlannedHours: Math.round(totalPlannedHours * 10) / 10,
    generatedAt: new Date().toISOString(),
    message
  };
};

const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

module.exports = { generateStudyPlan };