import { randomBytes, createHash } from "crypto";

import { createTransport } from "nodemailer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js"; // adjust to your User model's path

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

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

  // Create reset link (adjust the URL to match your frontend's reset password page)
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  // Send email
  const transporter = createTransport({
    service: "Gmail", // or use another email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
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