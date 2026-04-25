const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },      // rich text/notes
  fileUrl: { type: String, default: '' },       // PDF/file link
  fileOriginalName: { type: String, default: '' },
  order: { type: Number, default: 0 }
});

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],                  // 4 options
  correctAnswer: { type: Number, required: true } // index 0-3
});

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chaptersCompleted: [{ type: Number }],         // array of chapter indexes
  quizPassed: { type: Boolean, default: false },
  quizScore: { type: Number, default: 0 },
  completedAt: { type: Date }
});

const learningModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorRole: { type: String, enum: ['admin', 'student'], default: 'student' },
  chapters: [chapterSchema],
  quiz: [quizSchema],
  completedBy: [progressSchema],
  isPublic: { type: Boolean, default: false },   // admin modules = public
}, { timestamps: true });

module.exports = mongoose.model('LearningModule', learningModuleSchema);