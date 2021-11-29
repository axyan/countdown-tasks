const express = require('express');
const userRouter = express.Router();

const userController = require('../controllers/userController');

/**
 * USER ROUTES
 *
 * URL: /api/users/:id
 */

// POST request for creating a new user
userRouter.post('/users', userController.createUser);

// PUT request for updating a user
userRouter.put('/users/:id', userController.updateUser);

// DELETE request for deleting a user
userRouter.delete('/users/:id', userController.deleteUser);

module.exports = userRouter;
