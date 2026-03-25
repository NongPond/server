const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  // เพิ่ม 2 ฟิลด์นี้
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  verifyTokenExpire: Date
});

module.exports = mongoose.model("User", userSchema);
