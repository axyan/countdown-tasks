const { body, validationResult } = require('express-validator');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const blacklist = require('../utils/blacklist');

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
            id: user.id
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

              // Hacky solution to prevent XSS by encrypting JWT token string
              // so that string will need to be decrypted client-side before
              // being sent in authorization header back to server
              const encryptedJWT = CryptoJS.AES.encrypt(token, process.env.CRYPTOJS_SECRET).toString();

              res.status(200).json({ success: true, id: user.id, token: encryptedJWT });
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
exports.deleteSession = async (req, res, next) => {
  try {
    await blacklist.add(req.user.token, req.tokenPayload.exp);
    return res.sendStatus(204);
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, error: 'Error deleting session' });
  }
};
