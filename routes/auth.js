const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken"); // นำเข้า generateToken
const sgMail = require("@sendgrid/mail"); // นำเข้า SendGrid

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 1. ค้นหาว่ามีอีเมลนี้ในระบบหรือยัง
    let user = await User.findOne({ email });

    // 2. สร้าง Token ใหม่และเวลาหมดอายุใหม่ (24 ชม.) เตรียมไว้เลย
    const vToken = generateToken(); 
    const expireTime = Date.now() + 24 * 60 * 60 * 1000;
    const hashed = await bcrypt.hash(password, 10);

    if (user) {
      // 2.1 ถ้ามีอีเมลอยู่แล้ว และยืนยันแล้ว -> ห้ามสมัครซ้ำ!
      if (user.isVerified) {
        return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานและยืนยันแล้ว กรุณาเข้าสู่ระบบ" });
      } 
      // 2.2 ถ้ามีอีเมลอยู่แล้ว แต่ยังไม่ยืนยัน (เช่น ลิงก์หมดอายุ) -> ให้อัปเดตข้อมูลทับไปเลย
      else {
        user.name = name;
        user.password = hashed;
        user.verifyToken = vToken;
        user.verifyTokenExpire = expireTime;
        await user.save();
      }
    } else {
      // 3. ถ้าไม่เคยมีอีเมลนี้เลย -> สร้างใหม่ปกติ
      user = await User.create({
        name,
        email,
        password: hashed,
        verifyToken: vToken,
        verifyTokenExpire: expireTime
      });
    }

    const verifyLink = `https://client-2-no3k.onrender.com/verify?token=${vToken}`;
    const msg = {
      to: email,
      from: { email: process.env.EMAIL_USER, name: "Pondd App" },
      subject: "✅ กรุณายืนยันอีเมลของคุณ",
      html: `
        <div style="font-family:sans-serif; padding:20px; background-color:#f9f9f9; border-radius:8px;">
          <h2 style="color:#333;">สวัสดี ${name}</h2>
          <p style="color:#555; font-size:16px;">กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
          
          <a href="${verifyLink}" 
             style="display:inline-block; padding:12px 20px; background-color:#10b981; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; margin-top:15px;">
             ✅ ยืนยันอีเมลคลิกที่นี่
          </a>

          <div style="margin-top:25px; padding:15px; background-color:#e2e8f0; border-radius:6px;">
            <p style="margin:0; color:#475569; font-size:14px; font-weight:bold;">⚠️ หากปุ่มด้านบนกดไม่ได้ (เนื่องจากอีเมลอยู่ในกล่องจดหมายขยะ)</p>
            <p style="margin:5px 0 0 0; color:#475569; font-size:14px;">กรุณาคัดลอกลิงก์ด้านล่างนี้ไปวางในเบราว์เซอร์ของคุณ (Safari/Chrome):</p>
            <p style="margin:10px 0 0 0; color:#2563eb; font-size:14px; word-break:break-all;">
              ${verifyLink}
            </p>
          </div>
        </div>`
    };
    
    await sgMail.send(msg);

    res.json({ message: "สมัครสมาชิกสำเร็จ กรุณาเช็คอีเมลเพื่อยืนยันตัวตน" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Register failed" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password incorrect" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Email or password incorrect" });
    }

    // 🛡️ [เพิ่มโค้ดส่วนนี้] ดักเช็คว่ายืนยันอีเมลหรือยัง!
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "กรุณายืนยันอีเมลของคุณในกล่องจดหมายก่อนเข้าสู่ระบบ" 
      });
    }
    // 🛡️ สิ้นสุดส่วนที่เพิ่ม

    // ✅ เพิ่ม name เข้า token (อันนี้โค้ดเดิมของคุณ)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      name: user.name   
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= GET CURRENT USER ================= */
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);

  } catch (err) {
    console.error(err.message);
    res.status(401).json({ message: "Invalid token" });
  }
});

/* ================= VERIFY EMAIL ================= */
router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }

    // 1. หา User ที่มี verifyToken ตรงกับที่ส่งมา **และเวลายังไม่หมดอายุ**
    const user = await User.findOne({ 
      verifyToken: token,
      verifyTokenExpire: { $gt: Date.now() } // ✅ ย้ายมาเช็คในตอนค้นหา (ค้นหาตัวที่เวลายังมากกว่าเวลาปัจจุบัน)
    });

    // ถ้าไม่เจอ user หรือ token หมดอายุไปแล้ว
    if (!user) {
      return res.status(400).json({ message: "ลิงก์ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว" });
    }

    // 2. อัปเดตสถานะให้เป็น true และเคลียร์ Token กับเวลาทิ้งไป
    user.isVerified = true;
    user.verifyToken = undefined;       // เคลียร์ทิ้ง ป้องกันการกดซ้ำ
    user.verifyTokenExpire = undefined; // ✅ เคลียร์เวลาหมดอายุทิ้งไปด้วย ฐานข้อมูลจะได้สะอาด

    await user.save();

    res.json({ message: "ยืนยันอีเมลสำเร็จ คุณสามารถเข้าสู่ระบบได้แล้ว" });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ message: "Verify email failed" });
  }
});

module.exports = router;
