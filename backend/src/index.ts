import "dotenv/config";
import express from "express";
import cors from "cors";
import subjectRoutes from "./routes/subject.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import seedRoutes from "./routes/seed.routes.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use("/api/subjects", subjectRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/seed", seedRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 StudyStreak Backend running on http://localhost:${PORT}`);
});
