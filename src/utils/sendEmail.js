import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // TLS via port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Force IPv4 connection to prevent ECONNREFUSED ::1 errors
    family: 4,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const message = {
    from: `${process.env.FROM_EMAIL || 'Chat App'} <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  logger.info(`Email sent to ${options.email}: ${info.messageId}`);
};

export default sendEmail;
