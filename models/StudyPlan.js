const mongoose = require('mongoose');

// StudyPlan Schema - saves the generated study plan for a student
const studyPlanSchema = new mongoose.Schema({

  // Which student this plan belongs to
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // How many hours per day the student wants to study
  dailyStudyHours: {
    type: Number,
    default: 4,
    min: 1,
    max: 12
  },

  // The generated schedule (array of days)
  schedule: [
    {
      date: { type: String }, // format: YYYY-MM-DD
      dayName: { type: String }, // Monday, Tuesday, etc.
      totalHours: { type: Number },
      breakMessage: { type: String, default: null },
      sessions: [
        {
          taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
          title: { type: String },
          subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
          priority: { type: String },
          deadline: { type: Date },
          hoursToStudy: { type: Number }
        }
      ]
    }
  ],

  // Warnings about urgent or overdue tasks
  warnings: [
    {
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
      taskTitle: { type: String },
      type: { type: String }, // 'urgent' or 'overdue'
      message: { type: String }
    }
  ],

  // When this plan was generated
  generatedAt: {
    type: Date,
    default: Date.now
  },

  // Total number of study days in the plan
  totalDays: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

// Index for faster queries
studyPlanSchema.index({ user: 1 });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);