import { Router } from "express";
import { forgotPassword, resetPassword, verifyResetPasswordToken } from "../controllers/forgotPassword.controller.js"; // Adjust path as needed
const router = Router();

router.post("/forgot-password", forgotPassword);
router.get("/reset-password/:token", verifyResetPasswordToken);
router.post("/reset-password/:token", resetPassword);

export default router;
