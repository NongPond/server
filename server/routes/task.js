const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// POST: สร้าง task
router.post("/", async (req, res) => {
  const { title, description, status, email } = req.body;
  try {
    const task = new Task({ title, description, status, email });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: อัปเดต task
router.put("/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: ลบ task
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: ดึง task ตาม email
// เดิม:
// ✅ ใหม่:
router.get("/user/:email", async (req, res) => {
  try {
    const tasks = await Task.find({ email: req.params.email });
    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found." });
    }
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;

