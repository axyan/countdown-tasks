const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Task = require("../models/task");

/**
 * Handle POST for '/api/users'
 */
exports.createUser = [
  // Sanitize and validate inputs
  body("email", "Invalid email format")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Email is required")
    .bail()
    .isLength({ min: 3, max: 100 })
    .bail()
    .isEmail()
    .bail()
    .normalizeEmail()
    .escape(),
  body("password", "Password needs to be between 8 and 64 characters")
    .trim()
    .isLength({ min: 8, max: 64 })
    .bail()
    .escape(),
  body("confirmPassword", "Passwords do not match")
    .trim()
    .not()
    .isEmpty()
    .bail()
    .custom((confirmPassword, { req }) => confirmPassword === req.body.password)
    .bail()
    .escape(),

  // Check for validaton errors
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];

      res.status(400).json({ success: false, error: validationError.msg });
    } else {
      // Send 200 OK response even if email already register to maintain user privacy
      res.status(200).json({ success: true });

      User.exists({ email: req.body.email }, (err, emailExists) => {
        if (emailExists) {
          //TODO: If email exists, send notification to email
        } else {
          // Create new user
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return next(err);
            }

            const user = new User({
              email: req.body.email,
              password: hash,
            });

            user.save((err) => {
              if (err) {
                return next(err);
              }
            });
          });
        }
      });
    }
  },
];

/**
 * Handle PUT for '/api/users/:userId'
 */
exports.updateUser = [
  // Sanitize and validate inputs
  body("email", "Invalid email format")
    .trim()
    .optional({ checkFalsy: true })
    .isLength({ min: 3, max: 100 })
    .bail()
    .isEmail()
    .bail()
    .normalizeEmail()
    .escape(),
  body("oldPassword", "Password needs to be between 8 and 64 characters")
    .trim()
    .isLength({ min: 8, max: 64 })
    .bail()
    .escape(),
  body("newPassword", "Password needs to be between 8 and 64 characters")
    .trim()
    .isLength({ min: 8, max: 64 })
    .optional({ checkFalsy: true })
    .bail()
    .escape(),
  body("confirmNewPassword", "New passwords do not match")
    .trim()
    .isLength({ min: 8, max: 64 })
    .optional({ checkFalsy: true })
    .bail()
    .custom(
      (confirmNewPassword, { req }) =>
        confirmNewPassword === req.body.newPassword
    )
    .bail()
    .custom(
      (confirmNewPassword, { req }) =>
        confirmNewPassword !== req.body.oldPassword
    )
    .bail()
    .escape(),

  // Check for validaton errors
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];
      res.status(400).json({ success: false, error: validationError.msg });
    } else {
      User.findById(req.user.id).exec(async (err, user) => {
        if (err) {
          return next(err);
        }

        try {
          isMatch = await user.verifyPassword(req.body.oldPassword);
          if (!isMatch) {
            return res
              .status(400)
              .json({ success: false, error: "Incorrect password" });
          }
        } catch (e) {
          return next(e);
        }

        if (req.body.email !== undefined && req.body.email !== user.email) {
          user.email = req.body.email;
        }

        // Handle hashing password if new password provided
        if (
          req.body.newPassword !== undefined &&
          req.body.newPassword !== "" &&
          req.body.confirmNewPassword !== undefined &&
          req.body.confirmNewPassword !== ""
        ) {
          try {
            user.password = await bcrypt.hash(req.body.newPassword, 10);
          } catch (e) {
            return next(e);
          }
        }

        user.save((err) => {
          if (err) {
            return next(err);
          }
          res.sendStatus(200);
        });
      });
    }
  },
];

/**
 * Handle DELETE for '/api/users/:userId'
 */
exports.deleteUser = (req, res, next) => {
  // Delete all tasks belonging to user
  User.findById(req.user.id).exec((err, user) => {
    if (err) {
      return next(err);
    }

    user.tasks.map((taskId) => {
      Task.findByIdAndDelete(taskId, (err) => {
        if (err) {
          return next(err);
        }
      });
    });
  });

  User.findByIdAndDelete(req.user.id, (err) => {
    if (err) {
      return next(err);
    }
    res.sendStatus(204);
  });
};
