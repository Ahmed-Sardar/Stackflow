const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, default: '', trim: true },
  quantityOnHand: { type: Number, default: 0, min: 0 },
  costPrice: { type: Number, default: null, min: 0 },
  sellingPrice: { type: Number, default: null, min: 0 },
  lowStockThreshold: { type: Number, default: null, min: 0 },
}, { timestamps: true });

productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
module.exports = mongoose.model('Product', productSchema);
