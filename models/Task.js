const mongoose = require('mongoose');

// Task Schema - represents a study task/assignment that needs to be completed
const taskSchema = new mongoose.Schema({
  // Title of the task (e.g., "Chapter 5 - Calculus", "Prepare for Physics Quiz")
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },

  // Optional detailed description of the task
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Reference to which subject this task belongs to
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },

  // Reference to the user who created this task
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // When this task needs to be completed
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },

  // How many hours student estimates they need to complete this task
  estimatedHours: {
    type: Number,
    required: [true, 'Estimated study hours required'],
    min: [0.5, 'Minimum study time is 0.5 hours'],
    max: [100, 'Maximum study time is 100 hours']
  },

  // How much time has actually been spent (we'll update this later)
  actualHours: {
    type: Number,
    default: 0,
    min: 0
  },

  // Priority level of the task
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Current status of the task
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },

  // When the task was marked as completed
  completedAt: {
    type: Date,
    default: null
  },

  // Notes or additional information
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt
});

// Indexes for faster queries
taskSchema.index({ user: 1, status: 1 }); // find tasks by user and status
taskSchema.index({ user: 1, deadline: 1 }); // find tasks by user and deadline
taskSchema.index({ subject: 1 }); // find tasks by subject

// Method to mark task as completed
taskSchema.methods.markComplete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to calculate days remaining until deadline
taskSchema.methods.daysRemaining = function() {
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Static method to get all pending tasks for a user
taskSchema.statics.getPendingTasks = function(userId) {
  return this.find({ 
    user: userId, 
    status: { $ne: 'completed' } 
  }).populate('subject').sort({ deadline: 1 });
};

// Export the model
module.exports = mongoose.model('Task', taskSchema);