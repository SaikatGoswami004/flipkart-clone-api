const express = require("express");
const router = express.Router();
const userController = require("../../controller/admin-api/user-admin-controller");
const authMiddleware = require("../../middleware/auth-middleware");

// get user Route
router.get("/get-users", authMiddleware, userController.getAlluser);
//block or unblock user
router.patch(
  "/block-or-unblock-user/:userId",
  authMiddleware,
  userController.blockUnblockUser
);
//block or unblock user
router.delete(
  "/delete-user/:userId",
  authMiddleware,
  userController.deleteUser
);
module.exports = router;
