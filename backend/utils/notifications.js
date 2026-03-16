const nodemailer = require('nodemailer');

// ─── Email ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

exports.sendEmail = async (to, subject, text, html) => {
  try {
    if (!process.env.EMAIL_USER) { console.log('[EMAIL MOCK]', to, subject); return; }
    await transporter.sendMail({
      from: `"College Management" <${process.env.EMAIL_USER}>`,
      to, subject, text, html: html || `<p>${text}</p>`,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ─── SMS (Twilio) ─────────────────────────────────────────────────────────────
exports.sendSMS = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
      console.log('[SMS MOCK] To:', to, '| Msg:', message);
      return;
    }
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE, to });
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};
