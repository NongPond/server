const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  archived: {
  type: Boolean,
  default: false
},

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  /* ===== MEMBERS ===== */

  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      role: {
        type: String,
        enum: ["admin", "editor", "member"],
        default: "member"
      }
    }
  ],

  /* ⭐ INVITES (ระบบเมลเชิญ) */

  invites: [
    {
      email: {
        type: String,
        required: true
      },

      role: {
        type: String,
        enum: ["editor", "member"],
        default: "member"
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

}, { timestamps: true });


/* ===== INDEX ===== */

boardSchema.index({ ownerId: 1 });
boardSchema.index({ "members.userId": 1 });
boardSchema.index({ "invites.token": 1 });

module.exports = mongoose.model("Board", boardSchema);
