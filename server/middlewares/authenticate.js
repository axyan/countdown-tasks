const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(200).json({ success: false , error: 'Missing token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(200).json({ success: false, error: err.message });
    } else {
      req.userId = payload.id;
      next();
    }
  });
};
