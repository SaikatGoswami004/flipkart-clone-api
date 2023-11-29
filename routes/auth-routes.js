const express = require("express");
const router = express.Router();
const authController = require("../controller/web-api/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");

// Registration Route
router.post("/register", authController.register);
// Verify OTP Route
router.post("/verify-otp", authController.verifyOTP);
// Resend OTP Route
router.post("/resend-otp", authController.resendOTP);
// Login Route
router.post("/login", authController.login);
// Me Route
router.get("/me", authMiddleware, authController.me);
// Logout Route
router.delete("/logout", authMiddleware, authController.logout);
router.patch(
  "/set-profile-role",
  authMiddleware,
  authController.setProfileRole
);
// Request OTP
router.post("/forget-password/request-otp", authController.requestOTP);
// reset password
router.post("/forget-password/reset-password", authController.resetPassword);
//Change Password

router.patch("/change-password", authMiddleware, authController.changePassword);

module.exports = router;
