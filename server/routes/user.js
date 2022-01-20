const express = require("express");
const userRouter = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middlewares/authenticate");

/**
 * USER ROUTES
 *
 * URL: /api/users/:userId
 */

// POST request for creating a new user
userRouter.post("/users", userController.createUser);

// PUT request for updating a user
userRouter.put("/users/:userId", auth.verifyToken, userController.updateUser);

// DELETE request for deleting a user
userRouter.delete(
  "/users/:userId",
  auth.verifyToken,
  userController.deleteUser
);

module.exports = userRouter;
