//routes.subjets
const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");

// ─── Reusable helpers ─────────────────────────────────────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Validation rules ─────────────────────────────────────────────────────────
const createSubjectValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Subject name is required")
    .isLength({ min: 1, max: 60 }).withMessage("Subject name must be under 60 characters")
    .escape(),

  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).withMessage("Color must be a valid hex code (e.g. #3B82F6)"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Description must be under 300 characters")
    .escape(),
];

const updateSubjectValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Subject name cannot be empty")
    .isLength({ max: 60 }).withMessage("Subject name must be under 60 characters")
    .escape(),

  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).withMessage("Color must be a valid hex code (e.g. #3B82F6)"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage("Description must be under 300 characters")
    .escape(),
];

// ─── POST /api/subjects — Create a subject ────────────────────────────────────
router.post("/", auth, createSubjectValidation, async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { name, color, description } = req.body;

    // Prevent duplicate subject names for the same user
    const existing = await Subject.findOne({ name, user: req.user.id });
    if (existing) {
      return res.status(400).json({ msg: "You already have a subject with this name" });
    }

    const newSubject = new Subject({
      name,
      color: color || "#3B82F6",
      description,
      user: req.user.id,
    });

    const subject = await newSubject.save();
    res.status(201).json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── GET /api/subjects — Get all subjects for user ───────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── GET /api/subjects/:id — Get single subject ──────────────────────────────
router.get("/:id", auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid subject ID" });
  }

  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ msg: "Subject not found" });

    if (subject.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── PUT /api/subjects/:id — Update a subject ────────────────────────────────
router.put("/:id", auth, updateSubjectValidation, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid subject ID" });
  }

  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { name, color, description } = req.body;

    let subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ msg: "Subject not found" });

    if (subject.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // If renaming, check for duplicate name conflict
    if (name && name !== subject.name) {
      const duplicate = await Subject.findOne({ name, user: req.user.id });
      if (duplicate) {
        return res.status(400).json({ msg: "You already have a subject with this name" });
      }
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (color !== undefined) updateFields.color = color;
    if (description !== undefined) updateFields.description = description;

    subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── DELETE /api/subjects/:id — Delete a subject ─────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid subject ID" });
  }

  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) return res.status(404).json({ msg: "Subject not found" });

    if (subject.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await Subject.findByIdAndDelete(req.params.id);

    res.json({ msg: "Subject deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;