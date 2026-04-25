import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface SendPasswordResetEmailParams {
  to: string;
  resetToken: string;
  firstName?: string;
}

function getFrontendUrl(): string {
  const rawUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const urls = rawUrl.split(",").map((url) => url.trim());

  if(process.env.NODE_ENV === "production" && urls.length > 1) {
    return urls[urls.length -1];
  }

  return urls[0];
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  firstName = "User",
}: SendPasswordResetEmailParams): Promise<void> {
  const resetUrl = `${getFrontendUrl()}/?token=${resetToken}`;

  const mailOptions = {
    from: `"Umurava AI Screener" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #2b71f0 0%, #6d28d9 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #041738;
            margin-top: 0;
            font-size: 20px;
          }
          .content p {
            margin-bottom: 20px;
            color: #687588;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #2b71f0;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1a5dd8;
          }
          .footer {
            background-color: #f1f1f1;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #687588;
          }
          .footer a {
            color: #2b71f0;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Umurava AI Screener</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password for your Umurava AI Screener account. Click the button below to reset your password:</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2b71f0;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Umurava AI Screener. All rights reserved.</p>
            <p>If you have any questions, contact us at <a href="mailto:support@umurava.ai">support@umurava.ai</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}
