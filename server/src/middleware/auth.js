const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('stockflow_token='))?.slice(16);
    if (!token) return res.status(401).json({ error: 'Please log in.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('email organizationId');
    if (!user) return res.status(401).json({ error: 'Session expired. Please log in again.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

module.exports = requireAuth;
