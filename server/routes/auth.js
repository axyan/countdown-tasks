const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/authController');

// POST request for signing up a User
authRouter.post('/signup', authController.signupPost);

/**

// GET request for logging in a User
authRouter.get('/login', authController.loginGet);

// POST request for logging in a User
authRouter.post('/login', authController.loginPost);

// GET request for logging out a User
authRouter.get('/logout', authController.logoutGet);

**/

module.exports = authRouter;
