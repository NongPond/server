const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

router.use(auth);

/* ================= GET ALL ================= */
router.get("/", async (req, res) => {
  try {
    const list = await Notification.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Load notifications failed" });
  }
});

/* ================= GET UNREAD COUNT ================= */
router.get("/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Count failed" });
  }
});

/* ================= MARK AS READ ================= */
router.put("/:id/read", async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);

    if (!noti || noti.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "No permission" });
    }

    noti.read = true;
    await noti.save();

    res.json({ success: true });

  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Mark read failed" });
  }
});

/* ================= DELETE ================= */
router.delete("/:id", async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);

    if (!noti) {
      return res.status(404).json({ message: "Not found" });
    }

    if (noti.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "No permission" });
    }

    await noti.deleteOne();

    res.json({ success: true });

  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

/* ================= CLEAR ALL ================= */
router.delete("/clear/all", async (req, res) => {

  try {

    await Notification.deleteMany({
      userId: req.user.id
    });

    res.json({
      success: true
    });

  } catch (err) {

    console.error("Clear notifications error:", err);

    res.status(500).json({
      message: "Clear notifications failed"
    });

  }

});

module.exports = router;

