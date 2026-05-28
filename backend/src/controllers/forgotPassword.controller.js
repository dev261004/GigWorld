import { randomBytes, createHash } from "crypto";

import { createTransport } from "nodemailer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"; // adjust to your User model's path

const emailPattern = /^[a-z0-9._%+-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

const normalizeEmail = (value = "") => String(value).replace(/\s/g, "").toLowerCase().trim();

const isValidEmail = (value) => {
  if (!emailPattern.test(value)) {
    return false;
  }

  const [localPart] = value.split("@");
  return !localPart.startsWith(".") && !localPart.endsWith(".") && !localPart.includes("..");
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildPasswordResetEmail = ({ resetUrl, fullName }) => {
  const safeName = escapeHtml(fullName || "there");
  const safeResetUrl = escapeHtml(resetUrl);

  const text = [
    `Hi ${fullName || "there"},`,
    "",
    "We received a request to reset your GigWorld password.",
    "Use this link to choose a new password:",
    resetUrl,
    "",
    "This link expires in 10 minutes. If you did not request this, you can ignore this email.",
    "",
    "GigWorld Team",
  ].join("\n");

  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your GigWorld password</title>
  </head>
  <body style="margin:0;background:#f7fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
      Reset your GigWorld password. This link expires in 10 minutes.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:44px;height:44px;border-radius:12px;background:#1d4ed8;text-align:center;vertical-align:middle;color:#ffffff;font-size:22px;font-weight:800;">
                      G
                    </td>
                    <td style="padding-left:12px;font-size:22px;font-weight:800;color:#0f172a;">
                      Gig<span style="color:#1d4ed8;">World</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 8px;">
                <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#047857;">
                  Password reset
                </p>
                <h1 style="margin:0;font-size:28px;line-height:1.25;color:#0f172a;">
                  Reset your password
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 0;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#475569;">
                  Hi ${safeName},
                </p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#475569;">
                  We received a request to reset your GigWorld password. Click the button below to choose a new password.
                </p>
                <a href="${safeResetUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 18px;border-radius:8px;">
                  Reset password
                </a>
                <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#64748b;">
                  This link expires in 10 minutes. If you did not request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 28px;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#64748b;">
                  Button not working? Copy and paste this link into your browser:
                </p>
                <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6;color:#1d4ed8;">
                  ${safeResetUrl}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text };
};

const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate a reset token
  const resetToken = randomBytes(32).toString("hex");
  user.resetPasswordToken = createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

  await user.save({ validateBeforeSave: false });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
  const resetEmail = buildPasswordResetEmail({
    resetUrl,
    fullName: user.fullName,
  });

  // Send email
  const transporter = createTransport({
    service: "Gmail", // or use another email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"GigWorld Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your GigWorld password",
    text: resetEmail.text,
    html: resetEmail.html,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({ message: "Password reset link sent" });
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    // Hash the token and find user by token and token expiration
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
    });
  
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
  
    // Update the password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
  
    await user.save();
  
    res.status(200).json({ message: "Password reset successfully" });
  });

  export {forgotPassword,resetPassword}
