const express = require("express");
const router = express.Router();
const Board = require("../models/Board");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.use(auth);

/* ================= CREATE BOARD ================= */

router.post("/", async (req, res) => {

  try {

    const board = await Board.create({
      name: req.body.name,
      ownerId: req.user.id,
      members: []
    });

    res.json(board);

  } catch (err) {

    console.error("CREATE BOARD ERROR:", err);

    res.status(500).json({
      message: "Create board failed"
    });

  }

});

/* ================= GET BOARDS ================= */

router.get("/", async (req, res) => {

  try {

    const boards = await Board.find({
      $or: [
        { ownerId: req.user.id },
        { "members.userId": req.user.id }
      ]
    });

    res.json(boards);

  } catch (err) {

    res.status(500).json({
      message: "Load boards failed"
    });

  }

});

/* ================= GET SINGLE BOARD ================= */

router.get("/:id", async (req, res) => {

  try {

    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    res.json(board);

  } catch (err) {

    console.error("LOAD BOARD ERROR:", err);

    res.status(500).json({
      message: "Load board failed"
    });

  }

});

//* ================= SHARE BOARD ================= */

router.post("/:id/share", async (req, res) => {
  const { email, role = "member" } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const board = await Board.findOne({
    _id: req.params.id,
    ownerId: req.user.id
  });

  if (!board) return res.status(403).json({ message: "No permission" });

  const exists = board.members.find(
    m => m.userId.toString() === user._id.toString()
  );

  if (!exists) {
    board.members.push({ userId: user._id, role });
    await board.save();
  }

  res.json(board);
});

router.put("/:id/archive", async (req, res) => {

  const board = await Board.findOne({
    _id: req.params.id,
    ownerId: req.user.id
  });

  if (!board) return res.status(403).json({ message: "No permission" });

  board.archived = true;
  await board.save();

  res.json(board);
});

router.put("/:id/unarchive", async (req, res) => {

  const board = await Board.findOne({
    _id: req.params.id,
    ownerId: req.user.id
  });

  if (!board) return res.status(403).json({ message: "No permission" });

  board.archived = false;
  await board.save();

  res.json(board);
});

router.delete("/:id", async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!board) {
      return res.status(403).json({ message: "No permission" });
    }

    await board.deleteOne();

    res.json({ message: "Board deleted permanently" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
