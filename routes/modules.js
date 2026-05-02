const express = require('express');
const router = express.Router();
const LearningModule = require('../models/LearningModule');
const auth = require('../middleware/authMiddleware'); // your existing JWT middleware

// ─────────────────────────────────────────
// GET /api/modules — get all accessible modules
// ─────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const modules = await LearningModule.find({
      $or: [
        { createdBy: req.user.id },         // modules I created
        { isPublic: true }                  // public (admin) modules
      ]
    })
      .populate('subject', 'name color')
      .populate('createdBy', 'name')
      //.select('-quiz ')            // lean list, no heavy data
      .sort({ createdAt: -1 });

    // Attach progress for current user on each module
    const modulesWithProgress = modules.map(mod => {
      const modObj = mod.toObject();
      const userProgress = mod.completedBy?.find(
        p => p.user.toString() === req.user.id
      );
      modObj.myProgress = {
        chaptersCompleted: userProgress?.chaptersCompleted?.length || 0,
        totalChapters: mod.chapters?.length || 0,
        quizPassed: userProgress?.quizPassed || false,
      };
      delete modObj.completedBy;
      return modObj;
    });

    res.json(modulesWithProgress);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/modules — create a new module
// ─────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, subject, chapters, quiz, isPublic } = req.body;

    const module = new LearningModule({
      title,
      description,
      subject: subject || null,
      createdBy: req.user.id,
      creatorRole: req.user.role || 'student',  // assumes user has role field
      chapters: chapters || [],
      quiz: quiz || [],
      isPublic: req.user.role === 'admin' ? isPublic : false
    });

    await module.save();
    res.status(201).json(module);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/modules/:id — get single module
// ─────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await LearningModule.findById(req.params.id)
      .populate('subject', 'name color')
      .populate('createdBy', 'name');

    if (!module) return res.status(404).json({ message: 'Module not found' });

    // Check access
    const isOwner = module.createdBy._id.toString() === req.user.id;
    const isPublic = module.isPublic;
    if (!isOwner && !isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Attach user's own progress, hide others
    const modObj = module.toObject();
    const userProgress = module.completedBy?.find(
      p => p.user.toString() === req.user.id
    );
    modObj.myProgress = userProgress || {
      chaptersCompleted: [],
      quizPassed: false,
      quizScore: 0
    };
    delete modObj.completedBy;

    res.json(modObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
// PUT /api/modules/:id — update module (owner/admin only)
// ─────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const module = await LearningModule.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const isOwner = module.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, subject, chapters, quiz, isPublic } = req.body;
    if (title) module.title = title;
    if (description !== undefined) module.description = description;
    if (subject !== undefined) module.subject = subject;
    if (chapters) module.chapters = chapters;
    if (quiz) module.quiz = quiz;
    if (isPublic !== undefined && isAdmin) module.isPublic = isPublic;

    await module.save();
    res.json(module);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/modules/:id
// ─────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const module = await LearningModule.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    const isOwner = module.createdBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await module.deleteOne();
    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/modules/:id/progress — mark chapter done OR submit quiz
// ─────────────────────────────────────────
router.post('/:id/progress', auth, async (req, res) => {
  try {
    const { chapterIndex, quizAnswers } = req.body;
    const module = await LearningModule.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    // Find or create progress entry for this user
    let progress = module.completedBy.find(
      p => p.user.toString() === req.user.id
    );
    if (!progress) {
      module.completedBy.push({ user: req.user.id, chaptersCompleted: [] });
      progress = module.completedBy[module.completedBy.length - 1];
    }

    // Mark chapter complete
    if (chapterIndex !== undefined) {
      if (!progress.chaptersCompleted.includes(chapterIndex)) {
        progress.chaptersCompleted.push(chapterIndex);
      }
    }

    // Grade quiz
    if (quizAnswers && module.quiz.length > 0) {
      let correct = 0;
      quizAnswers.forEach((answer, i) => {
        if (module.quiz[i] && module.quiz[i].correctAnswer === answer) correct++;
      });
      const score = Math.round((correct / module.quiz.length) * 100);
      progress.quizScore = score;
      progress.quizPassed = score >= 70;  // 70% to pass
      if (progress.quizPassed) progress.completedAt = new Date();
    }

    await module.save();
    res.json({
      chaptersCompleted: progress.chaptersCompleted,
      quizPassed: progress.quizPassed,
      quizScore: progress.quizScore
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;