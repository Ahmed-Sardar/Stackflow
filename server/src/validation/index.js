const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredString(value, label, max = 200) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  if (value.trim().length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value.trim();
}

function optionalString(value, label, max = 2000) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return value.trim();
}

function numberField(value, label, { integer = false, optional = false, defaultValue = null } = {}) {
  if (value === '' || value == null) {
    if (optional) return defaultValue;
    throw new Error(`${label} is required.`);
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`${label} must be a non-negative ${integer ? 'integer' : 'number'}.`);
  }
  return value;
}

function productInput(body) {
  return {
    name: requiredString(body.name, 'Product name'),
    sku: requiredString(body.sku, 'SKU', 100).toUpperCase(),
    description: optionalString(body.description, 'Description'),
    quantityOnHand: numberField(body.quantityOnHand, 'Quantity', { integer: true, optional: true, defaultValue: 0 }),
    costPrice: numberField(body.costPrice, 'Cost price', { optional: true }),
    sellingPrice: numberField(body.sellingPrice, 'Selling price', { optional: true }),
    lowStockThreshold: numberField(body.lowStockThreshold, 'Low stock threshold', { integer: true, optional: true }),
  };
}

module.exports = { requiredString, emailPattern, numberField, productInput };
