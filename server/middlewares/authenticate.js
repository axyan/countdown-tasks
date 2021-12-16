const jwt = require('jsonwebtoken');

const Blacklist = require('../models/blacklist');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  let token;

  if (authHeader !== undefined && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  } else {
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
        return res
          .status(500)
          .json({ success: false, error: 'Error verifying token' });
      } else if (isMatch) {
        return res
          .status(401)
          .json({ success: false, error: 'Token is invalid' });
      } else {
        req.user = { id: payload.id, token: token };
        req.tokenPayload = { ...payload };
        next();
      }
    });
  });
};
