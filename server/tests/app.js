const express = require('express');
const createError = require('http-errors');

const indexRouter = require('../routes/index');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404, req.method.concat(' ', req.url)));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
});

module.exports = app;
