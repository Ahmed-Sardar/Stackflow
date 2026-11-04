const mongoose = require('mongoose');
const Product = require('../models/Product');
const Organization = require('../models/Organization');
const { productInput } = require('../validation');
const { withStockStatus } = require('../services/stock');

async function thresholdFor(req) {
  const organization = await Organization.findById(req.user.organizationId);
  if (!organization) throw Object.assign(new Error('Organization not found.'), { status: 404 });
  return organization.defaultLowStockThreshold;
}

async function list(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const query = { organizationId: req.user.organizationId };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [{ name: { $regex: escaped, $options: 'i' } }, { sku: { $regex: escaped, $options: 'i' } }];
  }
  const [products, threshold] = await Promise.all([Product.find(query).sort({ createdAt: -1 }), thresholdFor(req)]);
  res.json({ data: products.map(product => withStockStatus(product, threshold)) });
}

async function get(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
  const product = await Product.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ data: withStockStatus(product, await thresholdFor(req)) });
}

async function create(req, res) {
  const input = productInput(req.body);
  const product = await Product.create({ ...input, organizationId: req.user.organizationId });
  res.status(201).json({ data: withStockStatus(product, await thresholdFor(req)) });
}

async function update(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
  const input = productInput(req.body);
  const product = await Product.findOneAndUpdate({ _id: req.params.id, organizationId: req.user.organizationId }, input, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ data: withStockStatus(product, await thresholdFor(req)) });
}

async function remove(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found.' });
  const product = await Product.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ data: { deleted: true } });
}

module.exports = { list, get, create, update, remove };
