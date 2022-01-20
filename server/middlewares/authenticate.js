const blacklist = require("../utils/blacklist");
const jwt = require("../utils/jwt");

exports.verifyToken = async (req, res, next) => {
  // Grab token string from authorization header
  const token = jwt.parseAuthHeader(req.headers);
  if (token === null) {
    return res
      .status(401)
      .json({ success: false, error: "Token not provided" });
  }

  try {
    // Verify token signature and decode payload
    const payload = await jwt.verifyToken(token, process.env.JWT_SECRET);

    // Check if token is blacklisted
    const tokenBlacklisted = await blacklist.exists(token);
    if (tokenBlacklisted) {
      return res
        .status(401)
        .json({ success: false, error: "Token is invalid" });
    }

    // Attach user and token to request object to be used in following middlewares
    req.user = { id: payload.id, token: token };
    req.tokenPayload = { ...payload };
    next();
  } catch (e) {
    return res
      .status(e.httpErrorCode || 500)
      .json({ success: false, error: e.message || "Error verifying token" });
  }
};
