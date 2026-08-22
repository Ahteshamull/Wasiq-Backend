import nodemailer from "nodemailer";
import config from "../config";
import ApiError from "../errors/ApiErrors";

const stripHtml = (html: string): string => {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script blocks
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

const emailSender = async (subject: string, email: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: config.emailSender.host,
    port: config.emailSender.port,
    secure: config.emailSender.secure, // true for 465, false for other ports
    auth: {
      user: config.emailSender.email,
      pass: config.emailSender.app_pass,
    },
  });

  const mailOptions = {
    from: `"${config.emailSender.fromName}" <${config.emailSender.email}>`,
    to: email,
    subject,
    html,
    text: stripHtml(html),
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new ApiError(500, "Error sending email");
  }
};

export default emailSender;
