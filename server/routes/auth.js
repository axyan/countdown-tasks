const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/authController');
const auth = require('../middlewares/authenticate');

/**
 * SESSION ROUTES
 *
 * URL: /api/session
 */

// GET request to validate session token and return user info
authRouter.get('/session/user', auth.verifyToken, authController.returnUser);

// POST request for authenticating user and creating a new session
authRouter.post('/session', authController.createSession);

// DELETE request for deleting a session
authRouter.delete('/session', auth.verifyToken, authController.deleteSession);

module.exports = authRouter;
