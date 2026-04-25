const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Task = require('../models/Task');

// @route   GET /api/progress/stats
// @desc    Get full progress statistics for the logged in user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Get ALL tasks for this user with subject info
    const allTasks = await Task.find({ user: userId }).populate('subject', 'name color');

    // ── Overview Stats ───────────────────────────────────────────
    const totalTasks      = allTasks.length;
    const completedTasks  = allTasks.filter(t => t.status === 'completed');
    const pendingTasks    = allTasks.filter(t => t.status === 'pending');
    const inProgressTasks = allTasks.filter(t => t.status === 'in-progress');

    const completionRate = totalTasks > 0
      ? Math.round((completedTasks.length / totalTasks) * 100)
      : 0;

    // Total estimated hours for completed tasks (proxy for study hours)
    const totalStudyHours = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    // Overdue tasks
    const overdueTasks = allTasks.filter(t =>
      t.status !== 'completed' && new Date(t.deadline) < now
    );

    // ── Daily Completions — last 14 days ─────────────────────────
    const daily = [];
    for (let i = 13; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd   = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

      const count = completedTasks.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= dayStart && d < dayEnd;
      }).length;

      daily.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: count,
      });
    }

    // ── Study Streak ─────────────────────────────────────────────
    // Count consecutive days (going backwards from today) where at least 1 task was completed
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd   = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

      const hasActivity = completedTasks.some(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= dayStart && d < dayEnd;
      });

      if (hasActivity) {
        streak++;
      } else {
        // Allow gap only for today (streak may still be alive)
        if (i > 0) break;
      }
    }

    // ── Tasks Per Subject ────────────────────────────────────────
    const subjectMap = {};
    allTasks.forEach(task => {
      if (!task.subject) return;
      const subId = task.subject._id.toString();
      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          name: task.subject.name,
          color: task.subject.color || '#6C63FF',
          total: 0, completed: 0, pending: 0, inProgress: 0
        };
      }
      subjectMap[subId].total++;
      if (task.status === 'completed')   subjectMap[subId].completed++;
      else if (task.status === 'in-progress') subjectMap[subId].inProgress++;
      else subjectMap[subId].pending++;
    });
    const tasksBySubject = Object.values(subjectMap);

    // ── Priority Breakdown ───────────────────────────────────────
    const priorityBreakdown = {
      high:   allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low:    allTasks.filter(t => t.priority === 'low').length,
    };

    // ── Recent Activity (last 5 completed tasks) ─────────────────
    const recentActivity = completedTasks
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5)
      .map(t => ({
        id: t._id,
        title: t.title,
        subjectName:  t.subject?.name  || 'Unknown',
        subjectColor: t.subject?.color || '#6C63FF',
        completedAt:  t.completedAt,
        estimatedHours: t.estimatedHours
      }));

    // ── Upcoming Deadlines (next 5 pending tasks) ────────────────
    const upcomingDeadlines = allTasks
      .filter(t => t.status !== 'completed' && new Date(t.deadline) >= now)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
      .map(t => {
        const daysLeft = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
        return {
          id: t._id,
          title: t.title,
          subjectName:  t.subject?.name  || 'Unknown',
          subjectColor: t.subject?.color || '#6C63FF',
          deadline: t.deadline,
          daysLeft,
          priority: t.priority
        };
      });

    res.json({
      overview: {
        totalTasks,
        completedTasks:  completedTasks.length,
        pendingTasks:    pendingTasks.length,
        inProgressTasks: inProgressTasks.length,
        overdueTasks:    overdueTasks.length,
        completionRate,
        totalStudyHours: Math.round(totalStudyHours * 10) / 10,
        streak,
      },
      dailyCompletions: daily,
      tasksBySubject,
      priorityBreakdown,
      recentActivity,
      upcomingDeadlines,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;