const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/authController');

/**
 * SESSION ROUTES
 *
 * URL: /api/session
 */

// POST request for authenticating user and creating a new session
authRouter.post('/session', authController.createSession);

// DELETE request for deleting a session
authRouter.delete('/session', authController.deleteSession);

module.exports = authRouter;
