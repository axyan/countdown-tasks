const jwt = require('jsonwebtoken');

const Blacklist = require('../models/blacklist');

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ success: false , error: 'Token not provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res
        .status(401)
        .json({ success: false, error: err.message });
    }

    Blacklist.exists({ _id: token }, (err, isMatch) => {
      if (err) {
        res
          .status(500)
          .json({ success: false, error: 'Error verifying token' });
      } else if (isMatch) {
        res
          .status(401)
          .json({ success: false, error: 'Token is invalid' });
      } else {
        req.user = { id: payload.id };
        req.token = { ...payload };
        next();
      }
    });
  });
};
