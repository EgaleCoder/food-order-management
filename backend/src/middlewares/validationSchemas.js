const Joi = require('joi');

// Order Validation
const orderItemSchema = Joi.object({
  menuItemId: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid menu item ID format',
      'any.required': 'Menu item ID is required',
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .required()
    .messages({
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 20 per item',
      'any.required': 'Quantity is required',
    }),
});

const createOrderSchema = Joi.object({
  customerName: Joi.string()
    .trim()
    .min(2)
    .max(80)
    .pattern(/^[a-zA-Z\s.'-]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 80 characters',
      'string.pattern.base': 'Name can only contain letters, spaces and basic punctuation',
      'any.required': 'Customer name is required',
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enter a valid 10-digit Indian mobile number (starting with 6-9)',
      'any.required': 'Phone number is required',
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Address must be at least 5 characters',
      'any.required': 'Delivery address is required',
    }),

  city: Joi.string()
    .trim()
    .min(2)
    .max(60)
    .required()
    .messages({ 'any.required': 'City is required' }),

  state: Joi.string()
    .trim()
    .min(2)
    .max(60)
    .required()
    .messages({ 'any.required': 'State is required' }),

  zipCode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enter a valid 6-digit PIN code',
      'any.required': 'ZIP / PIN code is required',
    }),

  paymentMethod: Joi.string()
    .valid('UPI', 'Net Banking', 'Cash on Delivery')
    .required()
    .messages({
      'any.only': 'Invalid payment method. Choose UPI, Net Banking or Cash on Delivery',
      'any.required': 'Payment method is required',
    }),

  paymentStatus: Joi.string()
    .valid('Paid', 'Pending')
    .required()
    .messages({
      'any.only': 'Payment status must be either Paid or Pending',
      'any.required': 'Payment status is required',
    }),

  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'Order items are required',
    }),

  // Optional: allows saving with a specific status (e.g. 'Delivered' for deferred persistence)
  status: Joi.string()
    .valid('Order Received', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')
    .optional(),

  // Optional: clears DB cart after order is created
  cartSessionId: Joi.string().optional().allow(''),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Order Received', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')
    .required()
    .messages({
      'any.only': 'Invalid order status value',
      'any.required': 'Status is required',
    }),
});


module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
