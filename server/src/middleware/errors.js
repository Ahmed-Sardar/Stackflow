function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function errorHandler(error, req, res, next) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({ error: field === 'email' ? 'This email is already registered.' : 'This SKU already exists in your organization.' });
  }
  if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ error: error.message });
  if (error.status) return res.status(error.status).json({ error: error.message });
  if (error.message?.includes(' is required.') || error.message?.includes(' must be ')) return res.status(400).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { asyncHandler, errorHandler };
