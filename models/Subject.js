//const mongoose = require("mongoose");

//const SubjectSchema = new mongoose.Schema({
  //user: {
    //type: mongoose.Schema.Types.ObjectId,
    //ref: "User",
  //},
  //name: {
    //type: String,
    //required: true,
  //},
  //createdAt: {
    //type: Date,
    //default: Date.now,
  //},
//});

//module.exports = mongoose.model("Subject", SubjectSchema);

const mongoose = require('mongoose');

// Subject Schema - represents a subject/course that a student is studying
const subjectSchema = new mongoose.Schema({
  // The name of the subject (e.g., "Mathematics", "Physics", "History")
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true, // removes extra spaces
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },

  // Color code for UI display (helps students visually organize subjects)
  color: {
    type: String,
    default: '#3B82F6', // default blue color
    match: [/^#([A-Fa-f0-9]{6})$/, 'Please provide a valid hex color code']
  },

  // Optional description or notes about the subject
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Reference to the user who created this subject
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // references the User model
    required: true
  },

  // Track when subject was created
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // automatically adds createdAt and updatedAt fields
});

// Index for faster queries - find subjects by user
subjectSchema.index({ user: 1 });

// Virtual field to get all tasks for this subject (we'll use this later)
subjectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'subject'
});

// Export the model
module.exports = mongoose.model('Subject', subjectSchema);
