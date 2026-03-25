const express = require("express");
const router = express.Router();

const Task = require("../models/Task");
const User = require("../models/User");
const Board = require("../models/Board");

const auth = require("../middleware/auth");

const generateToken = require("../utils/generateToken");
const sendInviteEmail = require("../utils/sendInviteEmail");
const Notification = require("../models/Notification");

/* ================= PERMISSION CHECK ================= */

const getUserRole = async (boardId, userId) => {

  const board = await Board.findById(boardId);

  if (!board) return null;

  // owner
  if (board.ownerId.toString() === userId) {
    return "owner";
  }

  // member
  const member = board.members.find(
    m => m.userId.toString() === userId
  );

  return member?.role || null;
};

router.use(auth);



/* ================= GET ALL TASKS ================= */

router.get("/", async (req, res) => {

  try {

    const { boardId } = req.query; // ✅ เพิ่ม

    const boards = await Board.find({
      $or: [
        { ownerId: req.user.id },
        { "members.userId": req.user.id }
      ]
    });

    const boardIds = boards.map(b => b._id);

    let filter = {};

    if (boardId) {
      filter.boardId = boardId;
    } else {
      filter.boardId = { $in: boardIds };
    }

    const tasks = await Task.find(filter)
      .populate("ownerId", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: 1 });

    res.json(tasks);

  } catch (err) {

    console.error("LOAD TASK ERROR:", err);
    res.status(500).json({ message: "Load tasks failed" });

  }

});

/* ================= GET BOARD MEMBERS ================= */

router.get("/board/:boardId/members", async (req, res) => {

  try {

    const board = await Board.findById(req.params.boardId)
      .populate("ownerId", "name email")
      .populate("members.userId", "name email");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const list = [];

    if (board.ownerId) {

      list.push({
        userId: board.ownerId._id,
        email: board.ownerId.email,
        role: "owner"
      });

    }

    for (const m of board.members) {

      if (!m.userId) continue;

      list.push({
        userId: m.userId._id,
        email: m.userId.email,
        role: m.role
      });

    }

    res.json(list);

  } catch (err) {

    console.error("MEMBER ERROR:", err);
    res.status(500).json({ message: "Load members failed" });

  }

});

/* ================= CREATE TASK ================= */

router.post("/", async (req, res) => {

  try {

    const { title, status, startTime, endTime, category, boardId } = req.body;

    let board = null;

    if (boardId) {
      board = await Board.findById(boardId);
    }

    if (!board) {
      board = await Board.findOne({ ownerId: req.user.id });
    }

    if (!board) {

      board = await Board.create({
        name: "My Board",
        ownerId: req.user.id,
        members: []
      });

    }

    /* ===== CHECK PERMISSION ===== */

    const role = await getUserRole(board._id, req.user.id);

    if (role === "member") {
      return res.status(403).json({
        message: "Member cannot create task"
      });
    }

    /* ===== CHECK TIME CONFLICT ===== */

    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflicts = await Task.find({
      boardId: board._id,
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).sort({ startTime: 1 });

    if (conflicts.length > 0) {

      const duration = end - start;
      const suggestions = [];

      /* 1️⃣ เวลาหลัง task ที่ชน */

      for (const task of conflicts) {

        const suggestedStart = new Date(task.endTime);

        const suggestedEnd =
          new Date(suggestedStart.getTime() + duration);

        suggestions.push({
          suggestedStart,
          suggestedEnd
        });

      }

      /* 2️⃣ เวลาถัดไปอีก 1 ชั่วโมง */

      const plusOneHour = new Date(end);
      plusOneHour.setHours(plusOneHour.getHours() + 1);

      suggestions.push({
        suggestedStart: plusOneHour,
        suggestedEnd: new Date(plusOneHour.getTime() + duration)
      });

      /* 3️⃣ วันถัดไป */

      const tomorrow = new Date(start);
      tomorrow.setDate(tomorrow.getDate() + 1);

      suggestions.push({
        suggestedStart: tomorrow,
        suggestedEnd: new Date(tomorrow.getTime() + duration)
      });

      return res.status(409).json({
        conflict: true,
        suggestions
      });

    }

    /* ===== CREATE TASK ===== */

    const task = await Task.create({
      title,
      status,
      startTime,
      endTime,
      category,
      boardId: board._id,
      ownerId: board.ownerId,
      createdBy: req.user.id
    });

    const populated =
      await task.populate("createdBy", "name email");

    const io = req.app.get("io");

    if (io) {
      io.to(board._id.toString())
        .emit("taskUpdated");
    }

    res.json(populated);

  } catch (err) {

    console.error("CREATE TASK ERROR:", err);

    res.status(500).json({
      message: "Create task failed"
    });

  }

});


/* ================= UPDATE TASK ================= */

router.put("/:id", async (req, res) => {

  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const role = await getUserRole(task.boardId, req.user.id);

    if (role === "member") {
      return res.status(403).json({
        message: "Member cannot edit task"
      });
    }

    Object.assign(task, req.body);

    await task.save();

    const io = req.app.get("io");

    if (io) {
      io.to(task.boardId.toString()).emit("taskUpdated");
    }

    res.json(task);

  } catch (err) {

    console.error("UPDATE TASK ERROR:", err);
    res.status(500).json({ message: "Update task failed" });

  }

});

/* ================= DELETE TASK ================= */

router.delete("/:id", async (req, res) => {

  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const role = await getUserRole(task.boardId, req.user.id);

    if (role === "member") {
      return res.status(403).json({
        message: "Member cannot delete task"
      });
    }

    await task.deleteOne();

    const io = req.app.get("io");

    if (io) {
      io.to(task.boardId.toString()).emit("taskUpdated");
    }

    res.json({ message: "deleted" });

  } catch (err) {

    console.error("DELETE TASK ERROR:", err);
    res.status(500).json({ message: "Delete task failed" });

  }

});

/* ================= SHARE BOARD ================= */

router.post("/:boardId/share", async (req, res) => {

  try {

    const { email, role = "member" } = req.body;

    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = generateToken();

    board.invites.push({
      email,
      role,
      token
    });

    await board.save();

    /* notification */

    const notification = await Notification.create({
      userId: user._id,
      type: "invite",
      message: "📩 คุณถูกเชิญเข้าร่วมบอร์ด"
    });

    /* send email */

    const inviteLink =
      `${process.env.CLIENT_URL}/invite/${token}`;

    await sendInviteEmail({
      to: user.email,
      taskTitle: board.name,
      inviteLink
    });

    const io = req.app.get("io");

    if (io) {
      io.to(user._id.toString())
        .emit("newNotification", notification);
    }

    res.json({
      message: "Invite sent"
    });

  } catch (err) {

    console.error("SHARE ERROR:", err);

    res.status(500).json({
      message: "Share board failed"
    });

  }

});

/* ================= UPDATE MEMBER ROLE ================= */

router.put("/board/:boardId/member/:userId", async (req, res) => {

  try {

    const { role } = req.body;

    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (board.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can change role" });
    }

    const member = board.members.find(
      m => m.userId.toString() === req.params.userId
    );

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.role = role;

    await board.save();

    res.json({ message: "Role updated" });

  } catch (err) {

    console.error("ROLE ERROR:", err);
    res.status(500).json({ message: "Update role failed" });

  }

});



/* ================= REMOVE MEMBER ================= */

router.delete("/board/:boardId/member/:userId", async (req, res) => {

  try {

    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (board.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can remove" });
    }

    board.members = board.members.filter(
      m => m.userId.toString() !== req.params.userId
    );

    await board.save();

    res.json({ message: "Member removed" });

  } catch (err) {

    console.error("REMOVE MEMBER ERROR:", err);
    res.status(500).json({ message: "Remove member failed" });

  }

});



/* ================= LEAVE BOARD ================= */

router.post("/:boardId/leave", async (req, res) => {

  try {

    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    board.members = board.members.filter(
      m => m.userId.toString() !== req.user.id
    );

    await board.save();

    res.json({ message: "Left board successfully" });

  } catch (err) {

    console.error("LEAVE BOARD ERROR:", err);
    res.status(500).json({ message: "Leave board failed" });

  }

});

/* ================= ACCEPT INVITE ================= */

router.get("/invite/:token", async (req, res) => {

  try {

    const board = await Board.findOne({
      "invites.token": req.params.token
    });

    if (!board) {
      return res.status(404).json({
        message: "Invite not found"
      });
    }

    const invite = board.invites.find(
      i => i.token === req.params.token
    );

    if (!invite) {
      return res.status(404).json({
        message: "Invite invalid"
      });
    }

    if (invite.accepted) {
      return res.status(400).json({
        message: "Invite already used"
      });
    }

    /* ===== ADD MEMBER ===== */

    board.members.push({
      userId: req.user.id,
      role: invite.role
    });

    invite.accepted = true;

    await board.save();

    res.json({
      message: "Joined board",
      boardId: board._id
    });

  } catch (err) {

    console.error("ACCEPT INVITE ERROR:", err);

    res.status(500).json({
      message: "Accept invite failed"
    });

  }

});

module.exports = router;
