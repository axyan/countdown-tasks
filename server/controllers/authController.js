const { body, validationResult } = require('express-validator');

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

    const user = new User({
      email: req.body.email,
      password: req.body.password
    });

    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];
      res.status(200).json({ error: validationError.msg });
    } else {
      // No validation errors
      // Send 200 OK response even if username exists to maintain user privacy
      res.status(200).json();

      // Check if username is unique
      User.exists({ 'email': req.body.email }, ((err, emailExists) => {
        if (emailExists) {
          //TODO: If email exists, send notification to email
        } else {
          // Save new user
          user.save((err) => {
            if (err) { return next(err) }
          });
        }
      }));
    }
  })
];
