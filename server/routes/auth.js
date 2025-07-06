const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ตรวจสอบว่าอีเมลถูกใช้ไปแล้วหรือยัง
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้ไปแล้ว" });
    }

    // สร้างผู้ใช้ใหม่
    const newUser = new User({ email, password }); // คุณควรใช้ bcrypt เข้ารหัสจริง ๆ นะครับ
    await newUser.save();

    res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    res.json({ token: "1234", email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



