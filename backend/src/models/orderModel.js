const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "Order Received",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Received",
    },
    customerName: { type: String, required: true, trim: true },
    phone: { type: Number, required: true, trim: true },
    shippingAddress: {
      type: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        zipCode: { type: Number, required: true, trim: true },
      }
    },
    paymentMethod: { type: String, required: true, trim: true },
    paymentStatus: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
