// Creates an error with an HTTP status code
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Lets us use async/await in routes without try/catch everywhere
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Throws 400 if any required field is missing
const required = (body, fields) => {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ''
  );
  if (missing.length) {
    throw httpError(400, `Missing fields: ${missing.join(', ')}`);
  }
};

// Builds "col1 = ?, col2 = ?" for UPDATE queries from only the allowed fields sent
const buildUpdate = (body, allowed) => {
  const keys = allowed.filter((k) => body[k] !== undefined);
  if (!keys.length) throw httpError(400, 'No valid fields to update');
  return {
    setClause: keys.map((k) => `${k} = ?`).join(', '),
    values: keys.map((k) => body[k]),
  };
};

module.exports = { httpError, asyncHandler, required, buildUpdate };