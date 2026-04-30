const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  imageUrl: { type: String },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const cartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    items: [cartItemSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Cart', cartSchema);
