const { body, validationResult } = require('express-validator');
const passport = require('passport');
const jwt = require('jsonwebtoken');

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
            { expiresIn: '1h' },
            (err, token) => {
              if (err) {
                res.status(200).json({
                  success: false,
                  error: 'Error during authentication'
                });
                next(err);
              }

              /**
              res.status(200).json({
                success: true,
                token: "Bearer " + token
              });
              **/
              
              const cookieOptions = {
                httpOnly: true,
                sameSite: true,
                secure: true, 
                maxAge: 1000 * 60 * 60 // 1 hour
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
 * Deletes session by adding JWT of user to blacklist
 *
 * @response: None
 */
exports.deleteSession = (req, res, next) => {
  res.send('NOT IMPLEMENTED: Session DELETE');
};
