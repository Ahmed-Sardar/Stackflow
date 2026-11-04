const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  defaultLowStockThreshold: { type: Number, default: 5, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
