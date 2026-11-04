const Organization = require('../models/Organization');
const { numberField } = require('../validation');

async function get(req, res) {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) return res.status(404).json({ error: 'Organization not found.' });
  res.json({ data: { defaultLowStockThreshold: organization.defaultLowStockThreshold } });
}

async function update(req, res) {
  const value = numberField(req.body.defaultLowStockThreshold, 'Default low stock threshold', { integer: true });
  const organization = await Organization.findByIdAndUpdate(req.user.organizationId, { defaultLowStockThreshold: value }, { new: true, runValidators: true });
  if (!organization) return res.status(404).json({ error: 'Organization not found.' });
  res.json({ data: { defaultLowStockThreshold: organization.defaultLowStockThreshold } });
}

module.exports = { get, update };
