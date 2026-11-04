const Organization = require('../models/Organization');
const Product = require('../models/Product');
const { withStockStatus } = require('../services/stock');

async function overview(req, res) {
  const [organization, products] = await Promise.all([
    Organization.findById(req.user.organizationId),
    Product.find({ organizationId: req.user.organizationId }).sort({ name: 1 }),
  ]);
  if (!organization) return res.status(404).json({ error: 'Organization not found.' });
  const inventory = products.map(product => withStockStatus(product, organization.defaultLowStockThreshold));
  res.json({ data: {
    totalProducts: inventory.length,
    totalInventoryUnits: inventory.reduce((total, item) => total + item.quantityOnHand, 0),
    lowStockProducts: inventory.filter(item => item.stockStatus === 'Low Stock').length,
    outOfStockProducts: inventory.filter(item => item.stockStatus === 'Out of Stock').length,
    attentionProducts: inventory.filter(item => item.stockStatus !== 'In Stock'),
  } });
}

module.exports = { overview };
