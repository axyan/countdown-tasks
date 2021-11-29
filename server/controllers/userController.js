const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

/**
 * Handle POST for '/api/users'
 */
exports.createUser = [

  // Sanitize and validate inputs
  body('email', 'Invalid email format')
    .trim()
    .not().isEmpty().withMessage('Email is required').bail()
    .isEmail().bail()
    .normalizeEmail()
    .escape(),
  body('password', 'Password needs to be between 8 and 64 characters')
    .trim()
    .isLength({ min: 8, max: 64 }).bail()
    .escape(),
  body('confirmPassword', 'Passwords do not match')
    .trim()
    .not().isEmpty().bail()
    .custom((confirmPassword, { req }) => confirmPassword === req.body.password)
    .escape(),

  // Check for validaton errors and save new user
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
  }
];

/**
 * Handle PUT for '/api/users'
 */
exports.updateUser = (req, res, next) => {
  res.send('NOT IMPLEMENTED: Users PUT');
};

/**
 * Handle DELETE for '/api/users'
 */
exports.deleteUser = (req, res, next) => {
  res.send('NOT IMPLEMENTED: Users DELETE');
};
