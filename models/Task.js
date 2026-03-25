const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {

    /* ===== BOARD (สำคัญที่สุด) ===== */
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true
    },

    /* ===== TITLE ===== */
    title: {
      type: String,
      required: true
    },

    /* ===== DESCRIPTION ===== */
    description: {
      type: String,
      default: ""
    },

    /* ===== STATUS ===== */
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo"
    },

    /* ===== START TIME ===== */
    startTime: {
      type: Date,
      required: true
    },

    /* ===== END TIME ===== */
    endTime: {
      type: Date,
      required: true
    },

    /* ===== OWNER (เจ้าของบอร์ด) ===== */
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* ===== CREATED BY (ใครสร้าง task) ===== */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* ===== CATEGORY ===== */
    category: {
      type: String,
      default: "ทั่วไป"
    },

    /* ===== USERS ที่เข้าถึง TASK ===== */
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        role: {
          type: String,
          enum: ["editor", "viewer"],
          default: "viewer"
        }
      }
    ],

    /* ===== INVITE TOKEN ===== */
    invites: [
      {
        email: {
          type: String,
          required: true
        },
        role: {
          type: String,
          enum: ["editor", "viewer"],
          default: "viewer"
        },
        token: {
          type: String,
          required: true
        },
        accepted: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]

  },
  {
    timestamps: true
  }
);

/* ================= INDEX ================= */

// ตรวจเวลาซ้ำ
taskSchema.index({
  ownerId: 1,
  startTime: 1,
  endTime: 1
});

// ค้นหา task ใน board
taskSchema.index({
  boardId: 1
});

// calendar filter
taskSchema.index({
  startTime: 1
});

// category filter
taskSchema.index({
  category: 1
});

// shared task search
taskSchema.index({
  "sharedWith.userId": 1
});

module.exports = mongoose.model("Task", taskSchema);
