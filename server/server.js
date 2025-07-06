const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// ✨ import route
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// ✨ import task routes
const taskRoutes = require("./routes/task");
app.use("/api/tasks", taskRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at:`);
  console.log(`🔗 http://localhost:${PORT}/`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Tasks: http://localhost:${PORT}/api/tasks`);
});



