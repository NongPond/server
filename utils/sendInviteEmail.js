const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendInviteEmail = async ({ to, taskTitle, inviteLink }) => {
  const msg = {
    to,
    from: {
      email: process.env.EMAIL_USER,   // ⭐ ใช้จาก .env
      name: "Pondd App"
    },
    subject: "📩 คุณถูกเชิญเข้าร่วมบอร์ด",
    html: `
      <div style="font-family:sans-serif;padding:20px">
        <h2>📌 คุณถูกเชิญเข้าร่วมบอร์ด</h2>

        <p>บอร์ด: <b>${taskTitle}</b></p>

        <a href="${inviteLink}"
           style="
             display:inline-block;
             padding:12px 18px;
             background:#2563eb;
             color:white;
             border-radius:6px;
             text-decoration:none;
             margin-top:14px;
             font-weight:bold
           ">
           ✅ ยอมรับคำเชิญ
        </a>

        <p style="margin-top:18px;color:#666;font-size:13px">
          * กรุณาเข้าสู่ระบบก่อนกดรับคำเชิญ
        </p>
      </div>
    `
  };

  try {

    await sgMail.send(msg);

    console.log("📨 Invite email sent to:", to);

  } catch (error) {

    console.error(
      "❌ SendGrid error:",
      error.response?.body || error.message
    );

  }
};

module.exports = sendInviteEmail;
