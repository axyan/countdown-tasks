const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.send('NOT IMPLEMENTED: GET index');
});

module.exports = router;
