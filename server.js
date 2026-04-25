const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
//const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");

// Load environment variables FIRST (before any other imports that may use them)
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const subjectRoutes = require("./routes/subjects");
const taskRoutes = require("./routes/tasks");
const plannerRoutes = require("./routes/planner");
const progressRoutes = require("./routes/progress");

// Connect to MongoDB
connectDB();

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

// Sets secure HTTP response headers
app.use(helmet());

// CORS — restrict to your frontend origin in production
app.use(
  cors(//{
   // origin: process.env.FRONTEND_URL || "http://localhost:5173",
    //methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    //allowedHeaders: ["Content-Type", "x-auth-token"],
 // }
 )
);

// Parse JSON bodies
app.use(express.json({ limit: "1mb" }));

// Sanitize request data — prevents MongoDB operator injection attacks ($where, $gt etc.)
//app.use(mongoSanitize());
// Sanitize inputs to prevent MongoDB injection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// ─── Rate Limiters ───────────────────────────────────────────────────────────

// Auth routes — strict limit to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per window
  message: { msg: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API routes — generous limit for normal usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window
  message: { msg: "Too many requests. Please slow down and try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI route — limit separately since each call is expensive
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,                   // 10 AI requests per minute
  message: { msg: "Too many AI requests. Please wait a moment before asking again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", apiLimiter, profileRoutes);
app.use("/api/subjects", apiLimiter, subjectRoutes);
app.use("/api/tasks", apiLimiter, taskRoutes);
app.use("/api/planner", apiLimiter, plannerRoutes);
app.use("/api/progress", apiLimiter, progressRoutes);
app.use("/api/ai", aiLimiter, require("./routes/ai"));
app.use("/api/modules", apiLimiter, require("./routes/modules"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "SmartLearn API is running ✅", env: process.env.NODE_ENV || "development" });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);

  // Don't expose internal error details in production
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    message: "Something went wrong on the server",
    ...(isDev && { error: err.message }),
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});