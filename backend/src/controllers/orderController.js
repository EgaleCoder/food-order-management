const orderService = require('../services/orderService');
const logger = require('../utils/logger');

// GET /api/v1/orders
const getOrders = async (req, res, next) => {
  try {
    logger.info('[orderController] GET /api/v1/orders');
    const orders = await orderService.getAllOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('[orderController] getOrders error:', { message: error.message });
    next(error);
  }
};

// GET /api/v1/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    logger.info(`[orderController] GET /api/v1/orders/${req.params.id}`);
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('[orderController] getOrderById error:', { message: error.message });
    next(error);
  }
};

// POST /api/v1/orders
const createOrder = async (req, res, next) => {
  try {
    logger.info('[orderController] POST /api/v1/orders', { body: req.body });
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error('[orderController] createOrder error:', { message: error.message });
    next(error);
  }
};

// PATCH /api/v1/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    logger.info(`[orderController] PATCH /api/v1/orders/${req.params.id}/status → ${req.body.status}`);
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('[orderController] updateOrderStatus error:', { message: error.message });
    next(error);
  }
};

module.exports = { getOrders, getOrderById, createOrder, updateOrderStatus };
