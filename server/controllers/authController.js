const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

// Handle POST for '/signup'
exports.signupPost = [

  // Sanitize and validate inputs
  body('email', 'Invalid email format')
    .trim()
    .not().isEmpty().bail()
    .isEmail().bail()
    .normalizeEmail()
    .escape(),
  body('password', 'Password needs to be between 8 and 64 characters')
    .trim()
    .isLength({ min: 8, max: 64 })
    .escape(),
  body('confirmPassword', 'Passwords do not match')
    .trim()
    .not().isEmpty().bail()
    .custom((confirmPassword, { req }) => confirmPassword === req.body.password)
    .escape(),

  // Check for validaton errors and save new user
  ((req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];

      res.status(200).json({
        success: false,
        error: validationError.msg
      });

    // No validation errors
    } else {
      // Send 200 OK response even if username exists to maintain user privacy
      res.status(200).json({ success: true });

      // Check if username is unique
      User.exists({ 'email': req.body.email }, ((err, emailExists) => {
        if (emailExists) {
          //TODO: If email exists, send notification to email
        } else {
          // Create new user with hashed password
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) { return next(err) }

            const user = new User({
              email: req.body.email,
              password: hash
            });

            // Save new user
            user.save((err) => {
              if (err) { return next(err) }
            });
          });
        }
      }));
    }
  })
];

// Handle POST for '/login'
exports.loginPost = [

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
    }
    
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

            res.status(200).json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      }
    })(req, res, next);
  }
];
