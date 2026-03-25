require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");

const connectDB = require("./config/db");
const startReminderJob = require("./utils/reminderJob");

const app = express();

/* ================= CONNECT DB ================= */

connectDB();

/* ================= MIDDLEWARE ================= */

app.use(cors());
app.use(express.json());
app.use(helmet());

/* ================= ROUTES ================= */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/boards", require("./routes/boardRoutes"));

/* ================= SOCKET ================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/* เก็บ io ใน express */
app.set("io", io);

io.on("connection", (socket) => {

  console.log("🔌 User connected:", socket.id);

  /* ================= USER ROOM ================= */

  socket.on("join", (userId) => {

    socket.join(userId);

    console.log("👤 User joined room:", userId);

  });

  /* ================= BOARD ROOM ================= */

  socket.on("joinBoard", (boardId) => {

    if (!boardId) return;

    socket.join(boardId);

    console.log("📋 Joined board:", boardId);

  });

  /* ================= DEBUG ================= */

  socket.on("debugRooms", () => {
    console.log("rooms:", socket.rooms);
  });

  /* ================= DISCONNECT ================= */

  socket.on("disconnect", () => {

    console.log("❌ User disconnected:", socket.id);

  });

});

/* ================= ENV DEBUG ================= */

console.log("EMAIL:", process.env.EMAIL_USER);
console.log("PASS:", process.env.EMAIL_PASS ? "loaded" : "missing");
console.log("SENDGRID KEY LENGTH:", process.env.SENDGRID_API_KEY?.length);

/* ================= CRON JOB ================= */

startReminderJob(app);

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
