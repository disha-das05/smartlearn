//routes.tasks
const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");

// ─── Reusable validation error handler ───────────────────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
};

// ─── Reusable ObjectId validator ─────────────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Validation rules ─────────────────────────────────────────────────────────
const createTaskValidation = [
  body("title")
    .trim()
    .notEmpty().withMessage("Task title is required")
    .isLength({ min: 1, max: 100 }).withMessage("Title must be under 100 characters")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Description must be under 500 characters")
    .escape(),

  body("subject")
    .notEmpty().withMessage("Subject is required")
    .custom((val) => isValidObjectId(val)).withMessage("Invalid subject ID"),

  body("deadline")
    .notEmpty().withMessage("Deadline is required")
    .isISO8601().withMessage("Deadline must be a valid date")
    .toDate(),

  body("estimatedHours")
    .notEmpty().withMessage("Estimated hours is required")
    .isFloat({ min: 0.5, max: 100 }).withMessage("Estimated hours must be between 0.5 and 100"),

  body("priority")
    .optional()
    .isIn(["high", "medium", "low"]).withMessage("Priority must be high, medium, or low"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters")
    .escape(),
];

const updateTaskValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty().withMessage("Title cannot be empty")
    .isLength({ max: 100 }).withMessage("Title must be under 100 characters")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Description must be under 500 characters")
    .escape(),

  body("subject")
    .optional()
    .custom((val) => isValidObjectId(val)).withMessage("Invalid subject ID"),

  body("deadline")
    .optional()
    .isISO8601().withMessage("Deadline must be a valid date")
    .toDate(),

  body("estimatedHours")
    .optional()
    .isFloat({ min: 0.5, max: 100 }).withMessage("Estimated hours must be between 0.5 and 100"),

  body("actualHours")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("Actual hours must be between 0 and 100"),

  body("priority")
    .optional()
    .isIn(["high", "medium", "low"]).withMessage("Priority must be high, medium, or low"),

  body("status")
    .optional()
    .isIn(["pending", "in-progress", "completed"]).withMessage("Invalid status value"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Notes must be under 1000 characters")
    .escape(),
];

const filterQueryValidation = [
  query("status")
    .optional()
    .isIn(["pending", "in-progress", "completed"]).withMessage("Invalid status filter"),

  query("priority")
    .optional()
    .isIn(["high", "medium", "low"]).withMessage("Invalid priority filter"),

  query("subject")
    .optional()
    .custom((val) => isValidObjectId(val)).withMessage("Invalid subject ID in filter"),
];

// ─── POST /api/tasks — Create a new task ─────────────────────────────────────
router.post("/", auth, createTaskValidation, async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { title, description, subject, deadline, estimatedHours, priority, notes } = req.body;

    // Check if subject exists and belongs to user
    const subjectExists = await Subject.findOne({ _id: subject, user: req.user.id });
    if (!subjectExists) {
      return res.status(404).json({ msg: "Subject not found or unauthorized" });
    }

    const newTask = new Task({
      title,
      description,
      subject,
      user: req.user.id,
      deadline,
      estimatedHours,
      priority: priority || "medium",
      notes,
    });

    const task = await newTask.save();
    await task.populate("subject");

    res.status(201).json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── GET /api/tasks — Get all tasks for user ─────────────────────────────────
router.get("/", auth, filterQueryValidation, async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { status, subject, priority } = req.query;

    let filter = { user: req.user.id };
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate("subject", "name color")
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── GET /api/tasks/pending — Get all pending tasks ──────────────────────────
router.get("/pending", auth, async (req, res) => {
  try {
    const tasks = await Task.getPendingTasks(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── GET /api/tasks/:id — Get single task ────────────────────────────────────
router.get("/:id", auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(req.params.id).populate("subject");

    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── PUT /api/tasks/:id — Update a task ──────────────────────────────────────
router.put("/:id", auth, updateTaskValidation, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid task ID" });
  }

  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { title, description, subject, deadline, estimatedHours, actualHours, priority, status, notes } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // If subject is being changed, verify it belongs to user
    if (subject && subject !== task.subject.toString()) {
      const subjectExists = await Subject.findOne({ _id: subject, user: req.user.id });
      if (!subjectExists) {
        return res.status(404).json({ msg: "Subject not found or unauthorized" });
      }
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (subject !== undefined) updateFields.subject = subject;
    if (deadline !== undefined) updateFields.deadline = deadline;
    if (estimatedHours !== undefined) updateFields.estimatedHours = estimatedHours;
    if (actualHours !== undefined) updateFields.actualHours = actualHours;
    if (priority !== undefined) updateFields.priority = priority;
    if (status !== undefined) updateFields.status = status;
    if (notes !== undefined) updateFields.notes = notes;

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate("subject");

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── PATCH /api/tasks/:id/complete — Mark task as complete ───────────────────
router.patch("/:id/complete", auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid task ID" });
  }

  try {
    let task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    task = await task.markComplete();
    await task.populate("subject");

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ─── PATCH /api/tasks/:id/status — Update task status ────────────────────────
router.patch(
  "/:id/status",
  auth,
  [
    body("status")
      .notEmpty().withMessage("Status is required")
      .isIn(["pending", "in-progress", "completed"]).withMessage("Invalid status value"),
  ],
  async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: "Invalid task ID" });
    }

    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
      const { status } = req.body;

      let task = await Task.findById(req.params.id);

      if (!task) return res.status(404).json({ msg: "Task not found" });

      if (task.user.toString() !== req.user.id) {
        return res.status(403).json({ msg: "Not authorized" });
      }

      task.status = status;
      if (status === "completed") task.completedAt = new Date();

      await task.save();
      await task.populate("subject");

      res.json(task);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// ─── DELETE /api/tasks/:id — Delete a task ───────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ msg: "Invalid task ID" });
  }

  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ msg: "Task deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;