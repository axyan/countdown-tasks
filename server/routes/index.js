const express = require('express');
const indexRouter = express.Router();

const authRouter = require('./auth');

indexRouter.get('/', (req, res, next) => {
  res.send('NOT IMPLEMENTED: GET index');
});

indexRouter.use(authRouter);

module.exports = indexRouter;
