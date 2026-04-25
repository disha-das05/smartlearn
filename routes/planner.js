const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const StudyPlan = require('../models/StudyPlan');
const { generateStudyPlan } = require('../utils/plannerAlgorithm');

// @route   POST /api/planner/generate
// @desc    Generate a new study plan for the logged in student
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    // Get daily study hours from request (or use default 4)
    const dailyStudyHours = req.body.dailyStudyHours || 4;
    const maxSessionHours = req.body.maxSessionHours || 3.5;  // default 3.5

    // Validate hours
    if (dailyStudyHours < 1 || dailyStudyHours > 12) {
      return res.status(400).json({ 
        msg: "Daily study hours must be between 1 and 12" 
      });
    }

    // Get all pending tasks for this user
    const tasks = await Task.find({
      user: req.user.id,
      status: { $ne: 'completed' }
    }).populate('subject', 'name color');

    // Generate the study plan using our algorithm
    const planResult = generateStudyPlan(tasks, dailyStudyHours , maxSessionHours);

    // Save the plan to database
    // First delete old plan if exists
    await StudyPlan.findOneAndDelete({ user: req.user.id });

    // Create new plan
    const studyPlan = new StudyPlan({
      user: req.user.id,
      dailyStudyHours,
      schedule: planResult.schedule,
      warnings: planResult.warnings,
      totalDays: planResult.totalDays,
      generatedAt: new Date()
    });

    await studyPlan.save();

    // Send back the complete plan
    res.json({
      message: planResult.message,
      dailyStudyHours,
      totalDays: planResult.totalDays,
      warnings: planResult.warnings,
      schedule: planResult.schedule,
      generatedAt: planResult.generatedAt
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/planner
// @desc    Get the current study plan for the logged in student
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({ user: req.user.id }).populate('schedule.sessions.subject','name color');

    if (!studyPlan) {
      return res.status(404).json({ 
        msg: "No study plan found. Generate one first!" 
      });
    }

    res.json(studyPlan);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/planner/today
// @desc    Get today's study sessions only
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({ user: req.user.id }).populate('schedule.sessions.subject','name color');

    if (!studyPlan) {
      return res.status(404).json({ 
        msg: "No study plan found. Generate one first!" 
      });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Find today's schedule
    const todaySchedule = studyPlan.schedule.find(day => day.date === today);

    if (!todaySchedule) {
      return res.json({ 
        msg: "No study sessions scheduled for today! Enjoy your free time or get ahead on tomorrow's tasks.",
        sessions: []
      });
    }

    res.json({
      date: todaySchedule.date,
      dayName: todaySchedule.dayName,
      totalHours: todaySchedule.totalHours,
      sessions: todaySchedule.sessions,
      breakMessage: todaySchedule.breakMessage,
      warnings: studyPlan.warnings
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/planner
// @desc    Delete current study plan
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await StudyPlan.findOneAndDelete({ user: req.user.id });
    res.json({ msg: "Study plan deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;