/* ================= MIDDLEWARE ================= */

// 🔥 กำหนดให้รับการเชื่อมต่อจากหน้าเว็บเราได้
const corsOptions = {
  // ⚠️ อย่าลืมเปลี่ยนลิงก์ด้านล่างนี้ ให้เป็นลิงก์หน้าบ้าน (Static Site) ของคุณนะครับ
  origin: ["http://localhost:5173", "https://client-2-no3k.onrender.com"], 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());

/* ================= ROUTES ================= */

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, ... }
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};





