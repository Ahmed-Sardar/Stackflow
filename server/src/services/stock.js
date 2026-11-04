function withStockStatus(product, defaultThreshold) {
  const item = product.toObject ? product.toObject() : product;
  const applicableThreshold = item.lowStockThreshold ?? defaultThreshold;
  const stockStatus = item.quantityOnHand === 0 ? 'Out of Stock' : item.quantityOnHand <= applicableThreshold ? 'Low Stock' : 'In Stock';
  return { ...item, applicableThreshold, stockStatus };
}

module.exports = { withStockStatus };
