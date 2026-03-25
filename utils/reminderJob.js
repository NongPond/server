const cron = require("node-cron");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Board = require("../models/Board");

module.exports = function startReminderJob(app) {

  const io = app.get("io");

  cron.schedule("* * * * *", async () => {

    const now = new Date();

    const tasks = await Task.find({});

    for (const task of tasks) {

      const board = await Board.findById(task.boardId);
      if (!board) continue;

      const users = [
        board.ownerId,
        ...board.members.map(m => m.userId)
      ];

      const start = new Date(task.startTime);
      const end = new Date(task.endTime);

      const startMinus10 = new Date(start.getTime() - 10 * 60000);
      const endMinus10 = new Date(end.getTime() - 10 * 60000);

      const isNow = (time) => {
      return now >= time && now < new Date(time.getTime() + 60000);
    };

      for (const userId of users) {

        /* ก่อนเริ่ม 10 นาที */

        if (isNow(startMinus10)) {

          const exists = await Notification.findOne({
            userId,
            taskId: task._id,
            type: "startSoon"
          });

          if (!exists) {

            const notification = await Notification.create({
              userId,
              type: "startSoon",
              message: `⏰ งาน "${task.title}" จะเริ่มใน 10 นาที`,
              taskId: task._id
            });

            io.to(userId.toString()).emit(
              "newNotification",
              notification
            );

          }

        }

        /* ถึงเวลาเริ่ม */

        if (isNow(start)) {

          const exists = await Notification.findOne({
            userId,
            taskId: task._id,
            type: "startNow"
          });

          if (!exists) {

            const notification = await Notification.create({
              userId,
              type: "startNow",
              message: `🚀 งาน "${task.title}" เริ่มแล้ว`,
              taskId: task._id
            });

            io.to(userId.toString()).emit(
              "newNotification",
              notification
            );

          }

        }

        /* ก่อนครบกำหนด */

        if (isNow(endMinus10)) {

          const exists = await Notification.findOne({
            userId,
            taskId: task._id,
            type: "dueSoon"
          });

          if (!exists) {

            const notification = await Notification.create({
              userId,
              type: "dueSoon",
              message: `⚠️ งาน "${task.title}" ใกล้ครบกำหนดใน 10 นาที`,
              taskId: task._id
            });

            io.to(userId.toString()).emit(
              "newNotification",
              notification
            );

          }

        }

        /* สิ้นสุด */

        if (isNow(end)) {

          const exists = await Notification.findOne({
            userId,
            taskId: task._id,
            type: "dueNow"
          });

          if (!exists) {

            const notification = await Notification.create({
              userId,
              type: "dueNow",
              message: `⛔ งาน "${task.title}" ถึงเวลาสิ้นสุดแล้ว`,
              taskId: task._id
            });

            io.to(userId.toString()).emit(
              "newNotification",
              notification
            );

          }

        }

      }

    }

  });

};