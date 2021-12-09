const { body, validationResult } = require('express-validator');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const Blacklist = require('../models/blacklist');

/**
 * Handle GET for '/api/session/user'
 * Returns user id when provided with valid JWT
 *
 * @response: User ID
 */
exports.returnUser = (req, res, next) => {
  res.status(200).json({ success: true, id: req.user.id });
};

/**
 * Handle POST for '/api/session'
 * Authenticates user and 'creates' a new session
 *
 * @response: JWT token upon successful authentication
 */
exports.createSession = [

  // Sanitize and validate inputs
  body('email', 'Invalid email or password')
    .trim()
    .not().isEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Invalid email format').bail()
    .normalizeEmail()
    .escape(),
  body('password', 'Invalid email or password')
    .trim()
    .not().isEmpty().withMessage('Password is required').bail()
    .escape(),

  // Check for validation errors and login user
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];
      res.status(200).json({
        success: false,
        error: validationError.msg
      });
    
    // No validation errors
    } else {
      // Authenticate user provided email and password
      passport.authenticate('local', { session: false }, (err, user, info) => {

        // Error during authentication
        if (err) {
          res.status(200).json({
            success: false,
            error: 'Error during authentication'
          });
          next(err);
        
        // User not found
        } else if (!user) {
          res.status(200).json({
            success: false,
            error: 'Invalid email or password'
          });

        // Successful authentication
        } else {
          const payload = {
            id: user._id 
          }

          // Create JSON web token
          jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
            (err, token) => {
              if (err) {
                res.status(200).json({
                  success: false,
                  error: 'Error during authentication'
                });
                next(err);
              }

              const cookieOptions = {
                httpOnly: true,
                sameSite: true,
                secure: true, 
                maxAge: process.env.COOKIE_MAX_AGE
              }

              // Set cookie in response header
              res
                .status(200)
                .cookie('token', token, cookieOptions)
                .json({ success: true });
            }
          );
        }
      })(req, res, next);
    }
  }
];

/**
 * Handle DELETE for '/api/session'
 * Deletes session by adding JWT of user to a blacklist
 *
 * @response: None
 */
exports.deleteSession = (req, res, next) => {
  const blacklistToken = new Blacklist({
    _id: req.cookies.token,
    expiration: req.token.exp
  });

  blacklistToken.save(err => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, error: 'Error deleting session' });
    } else {
      return res.status(200).json({ success: true });
    }
  });
};
