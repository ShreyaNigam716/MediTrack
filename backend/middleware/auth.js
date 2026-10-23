const jwt = require('jsonwebtoken');
const { httpError } = require('../utils');

// Reads the token, checks it, and puts the user on req.user
const authenticate = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'Login required'));
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, name }
    next();
  } catch {
    next(httpError(401, 'Invalid or expired token, please log in again'));
  }
};

// Allows only the listed roles
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(httpError(403, 'You do not have permission for this action'));
  }
  next();
};

// One-line permission rule for a whole route group:
// GET requests need a role in read OR write, anything else needs a role in write
const access = ({ read = [], write = [] }) => (req, res, next) => {
  const allowed = req.method === 'GET' ? [...read, ...write] : write;
  return authorize(...allowed)(req, res, next);
};

module.exports = { authenticate, authorize, access };