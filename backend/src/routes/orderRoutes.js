const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const validate = require('../middlewares/validate');
const { createOrderSchema, updateOrderStatusSchema } = require('../middlewares/validationSchemas');

// GET /api/v1/orders
router.get('/', getOrders);

// GET /api/v1/orders/:id
router.get('/:id', getOrderById);

// POST /api/v1/orders
router.post('/', validate(createOrderSchema), createOrder);

// PATCH /api/v1/orders/:id/status - for now we're not using
router.patch('/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
