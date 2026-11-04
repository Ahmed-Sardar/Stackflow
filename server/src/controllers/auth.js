const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { requiredString, emailPattern } = require('../validation');

function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('stockflow_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function publicUser(user, organization) {
  return { id: user.id, email: user.email, organization: { id: organization.id, name: organization.name } };
}

async function signup(req, res) {
  const name = requiredString(req.body.organizationName, 'Organization name');
  const email = requiredString(req.body.email, 'Email').toLowerCase();
  if (!emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  const password = requiredString(req.body.password, 'Password');
  if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
  if (password !== req.body.confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
  if (await User.exists({ email })) return res.status(409).json({ error: 'This email is already registered.' });

  const organization = await Organization.create({ name });
  let user;
  try {
    user = await User.create({ email, password: await bcrypt.hash(password, 12), organizationId: organization.id });
  } catch (error) {
    await Organization.deleteOne({ _id: organization.id });
    throw error;
  }
  setSession(res, user);
  res.status(201).json({ data: publicUser(user, organization) });
}

async function login(req, res) {
  const email = requiredString(req.body.email, 'Email').toLowerCase();
  const password = requiredString(req.body.password, 'Password');
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid email or password.' });
  const organization = await Organization.findById(user.organizationId);
  if (!organization) return res.status(401).json({ error: 'Account organization is unavailable.' });
  setSession(res, user);
  res.json({ data: publicUser(user, organization) });
}

async function me(req, res) {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) return res.status(401).json({ error: 'Account organization is unavailable.' });
  res.json({ data: publicUser(req.user, organization) });
}

function logout(req, res) {
  res.clearCookie('stockflow_token', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ data: { loggedOut: true } });
}

module.exports = { signup, login, me, logout };
