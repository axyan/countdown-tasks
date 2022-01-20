const express = require("express");
const taskRouter = express.Router({ mergeParams: true });

const taskController = require("../controllers/taskController");
const auth = require("../middlewares/authenticate");

/**
 * TASK ROUTES
 *
 * URL: /api/users/:userId/tasks/:taskId
 */

// GET request for getting all tasks for a user
taskRouter.get("/tasks", auth.verifyToken, taskController.readUserTasks);

// POST request for creating a new task
taskRouter.post("/tasks", auth.verifyToken, taskController.createTask);

// PUT request for updating a task
taskRouter.put("/tasks/:taskId", auth.verifyToken, taskController.updateTask);

// DELETE request for deleting a task
taskRouter.delete(
  "/tasks/:taskId",
  auth.verifyToken,
  taskController.deleteTask
);

module.exports = taskRouter;
