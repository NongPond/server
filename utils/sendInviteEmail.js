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
    // ✅ เพิ่ม text ธรรมดาเข้าไปด้วย ช่วยลดโอกาสโดนมองเป็น Spam
    text: `คุณถูกเชิญเข้าร่วมบอร์ด: ${taskTitle}\nหากไม่สามารถกดปุ่มได้ กรุณาคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์เพื่อยอมรับคำเชิญ: ${inviteLink}`,
    html: `
      <div style="font-family:sans-serif; padding:20px; background-color:#f9f9f9; border-radius:8px; max-width:500px;">
        <h2 style="color:#333;">📌 คุณถูกเชิญเข้าร่วมบอร์ด</h2>

        <p style="color:#555; font-size:16px;">บอร์ด: <b>${taskTitle}</b></p>

        <a href="${inviteLink}"
           style="
             display:inline-block;
             padding:12px 18px;
             background:#2563eb;
             color:white;
             border-radius:6px;
             text-decoration:none;
             margin-top:14px;
             font-weight:bold;
           ">
           ✅ ยอมรับคำเชิญ
        </a>

        <div style="margin-top:25px; padding:15px; background-color:#e2e8f0; border-radius:6px;">
          <p style="margin:0; color:#475569; font-size:14px; font-weight:bold;">⚠️ หากปุ่มด้านบนกดไม่ได้</p>
          <p style="margin:5px 0 0 0; color:#475569; font-size:14px;">(มักเกิดขึ้นเมื่ออีเมลอยู่ในกล่องจดหมายขยะ) กรุณาคัดลอกลิงก์ด้านล่างนี้ไปวางในเบราว์เซอร์ของคุณ (Safari/Chrome):</p>
          <p style="margin:10px 0 0 0; color:#2563eb; font-size:14px; word-break:break-all;">
            ${inviteLink}
          </p>
        </div>

        <p style="margin-top:18px; color:#666; font-size:13px;">
          * หมายเหตุ: กรุณาเข้าสู่ระบบในเบราว์เซอร์ก่อนนำลิงก์ไปวาง เพื่อดำเนินการรับคำเชิญให้สมบูรณ์
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
