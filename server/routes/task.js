const express = require('express');
const taskRouter = express.Router({ mergeParams: true });

const taskController = require('../controllers/taskController');

/**
 * TASK ROUTES (CHILD ROUTER)
 *
 * URL: /api/users/:id/tasks/:id
 */

// GET request for getting all tasks for a user
taskRouter.get('/tasks', taskController.readUserTasks);

// POST request for creating a new task
taskRouter.post('/tasks', taskController.createTask);

// PUT request for updating a task
taskRouter.put('/tasks/:id', taskController.updateTask);

// DELETE request for deleting a task
taskRouter.delete('/tasks/:id', taskController.deleteTask);

module.exports = taskRouter;
