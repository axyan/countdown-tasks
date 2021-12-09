const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const Task = require('../models/task');
const User = require('../models/user');

/**
 * Handle GET for '/api/users/:userId/tasks'
 */
exports.readUserTasks = (req, res, next) => {
  User
    .findById(req.user.id)
    .populate('tasks')
    .exec((err, user) => {
      if (err) { return next(err); }
      res.status(200).json({ tasks: user.tasks });
    });
};

/**
 * Handle POST for '/api/users/:userId/tasks'
 */
exports.createTask = [

  // Sanitize and validate inputs
  body('name')
    .trim()
    .not().isEmpty().withMessage('Task name is required').bail()
    .escape(),
  body('due')
    .trim()
    .not().isEmpty().withMessage('Task due timestamp is required').bail()
    .isInt({ min: 0, allow_leading_zeros: false }).withMessage('Task due timestamp needs to be in Unix time and greater than 0').bail()
    .custom((value) => value > Math.floor(Date.now() / 1000)).withMessage('Task due timestamp cannot be in the past').bail()
    .escape(),

  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];
      res.status(400).json({ success: false, error: validationError.msg });
    } else {
      // Create task for current user
      User
        .findById(req.user.id)
        .exec((err, user) => {
          if (err) { return next(err); }

          const task = new Task({
            name: req.body.name,
            due: req.body.due
          });

          task.save((err) => {
            if (err) { return next(err); }
            user.tasks.push(task);

            // Possible edge case since it loads doc to update
            user.save((err) => {
              if (err) { return next(err); }

              const payload = {
                id: task._id,
                name: task.name,
                due: task.due
              };

              res.status(201).json({ task: payload });
            });
          });
        });
    }
  }
];

/**
 * Handle PUT for '/api/users/:userId/tasks/:taskId'
 */
exports.updateTask = [

  // Sanitize and validate inputs
  body('name')
    .trim()
    .optional({ checkFalsy: true })
    .escape(),
  body('due')
    .trim()
    .optional({ checkFalsy: true })
    .isInt({ min: 0, allow_leading_zeros: false }).withMessage('Task due timestamp needs to be in Unix time and greater than 0').bail()
    .custom((value) => value > Math.floor(Date.now() / 1000)).withMessage('Task due timestamp cannot be in the past').bail()
    .escape(),

  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const validationError = errors.array()[0];
      res.status(400).json({ success: false, error: validationError.msg });
    } else {
      // Update task if found under user's tasks
      User
        .findById(req.user.id)
        .exec((err, user) => {
          if (err || !user.tasks) { return next(err); }

          if (user.tasks.includes(mongoose.Types.ObjectId(req.params.taskId))) {
            Task
              .findById(req.params.taskId)
              .exec((err, task) => {
                if (err) { return next(err); }

                if (req.body.name !== undefined) {
                  task.name = req.body.name;
                }
                
                if (req.body.due !== undefined) {
                  task.due = req.body.due;
                }

                task.save((err) => {
                  if (err) { return next(err); }

                  const payload = {
                    _id: task._id,
                    name: task.name,
                    due: task.due
                  };

                  res.status(200).json({ task: payload });
                });
              });
          } else {
            res.status(404).json({ success: false, error: 'Task not found' });
          }
        });
    }
  }
];

/**
 * Handle DELETE for '/api/users/:userId/tasks/:taskId'
 */
exports.deleteTask = (req, res, next) => {
  // Delete task if only found under user's tasks
  User
    .findById(req.user.id)
    .exec((err, user) => {
      if (err || !user.tasks) { return next(err); }

      if (user.tasks.includes(mongoose.Types.ObjectId(req.params.taskId))) {
        Task.findByIdAndDelete(req.params.taskId, (err, deletedTask) => {
          if (err) { return next(err); }
          res.sendStatus(204);
        });
      } else {
        res.status(404).json({ success: false, error: 'Task not found' });
      }
    });
};
