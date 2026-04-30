const Order = require('../models/orderModel');
const MenuItem = require('../models/menuItemModel');
const cartService = require('./cartService');
const logger = require('../utils/logger');

const getAllOrders = () => {
  logger.info('[orderService] Fetching all orders');
  return Order.find()
    .populate('items.menuItem', 'name price imageUrl')
    .sort({ createdAt: -1 });
};

const getOrderById = (id) => {
  logger.info(`[orderService] Fetching order by id: ${id}`);
  return Order.findById(id).populate('items.menuItem', 'name price imageUrl');
};

/**
 * Create an order.
 * - items: [{ menuItemId, quantity }] — looked up from DB
 * - status: optional, defaults to 'Order Received'. Pass 'Delivered' for deferred saves.
 * - cartSessionId: optional. If provided, the cart is cleared after a successful order.
 */
const createOrder = async (data) => {
  const {
    items, customerName, phone, address, city, state,
    zipCode, paymentMethod, paymentStatus,
    status,          // optional — 'Delivered' when saving after simulation
    cartSessionId,   // optional — clear DB cart after order creation
  } = data;

  logger.info(`[orderService] Creating order for customer: ${customerName}${status ? ` (status: ${status})` : ''}`);

  // Validate and enrich items with menu data from DB
  const enrichedItems = await Promise.all(
    items.map(async ({ menuItemId, quantity }) => {
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) {
        logger.warn(`[orderService] Menu item not found: ${menuItemId}`);
        throw new Error(`Menu item not found: ${menuItemId}`);
      }
      return {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      };
    }),
  );

  const totalAmount = enrichedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const orderPayload = {
    items: enrichedItems,
    totalAmount,
    customerName,
    phone,
    shippingAddress: {
      street:  address,
      city,
      state,
      zipCode,
    },
    paymentMethod,
    paymentStatus,
  };

  // Allow caller to set the initial status (e.g. 'Delivered' for deferred persistence)
  if (status) orderPayload.status = status;

  const order = await Order.create(orderPayload);
  logger.info(`[orderService] Order created: ${order._id} | Total: ₹${totalAmount}`);

  // Clear the cart from DB if a sessionId was provided
  if (cartSessionId) {
    await cartService.clearCart(cartSessionId);
    logger.info(`[orderService] Cart cleared for session: ${cartSessionId}`);
  }

  return order;
};

const updateOrderStatus = (id, status) => {
  logger.info(`[orderService] Updating order ${id} status to: ${status}`);
  return Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
};

module.exports = { getAllOrders, getOrderById, createOrder, updateOrderStatus };
