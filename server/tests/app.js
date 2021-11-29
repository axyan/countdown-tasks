const express = require('express');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');

const passport = require('passport');

const apiRouter = require('../routes/api');

const app = express();

// Test environment variable setup
require('dotenv').config({
  path: './.env.test'
});

// Passport setup
require('../config/passport')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api', apiRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404, req.method.concat(' ', req.url)));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
});

module.exports = app;
