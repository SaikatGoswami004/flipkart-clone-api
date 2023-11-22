const express = require("express");
const router = express.Router();
const authController = require("../controller/web-api/auth-controller");
// Registration Route
router.post("/register", authController.register);
// Verify OTP Route
router.post("/verify-otp", authController.verifyOTP);
// Resend OTP Route
router.post("/resend-otp", authController.resendOTP);
// Login Route
router.post("/login", authController.login);

module.exports = router;
