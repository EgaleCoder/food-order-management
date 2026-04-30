// Cart controller: Handles API requests related to cart operations and delegates to cartService.
const cartService = require('../services/cartService');

// GET /api/v1/cart/:sessionId
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.params.sessionId);
    res.json({ success: true, data: cart });
  } catch (e) {
    console.log('[cartController] getCart error:', { message: e.message });
    next(e);
  }
};

// POST /api/v1/cart/:sessionId/items  — body: { menuItemId, name, price, imageUrl, quantity }
const addItem = async (req, res, next) => {
  try {
    const cart = await cartService.addItem(req.params.sessionId, req.body);
    res.json({ success: true, data: cart });
  } catch (e) {
    console.log('[cartController] addItem error:', { message: e.message });
    next(e);
  }
};

// PATCH /api/v1/cart/:sessionId/items/:menuItemId  — body: { quantity }
const updateItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateItem(
      req.params.sessionId,
      req.params.menuItemId,
      req.body.quantity,
    );
    res.json({ success: true, data: cart });
  } catch (e) {
    console.log('[cartController] updateItem error:', { message: e.message });
    next(e);
  }
};

// DELETE /api/v1/cart/:sessionId/items/:menuItemId
const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(req.params.sessionId, req.params.menuItemId);
    res.json({ success: true, data: cart });
  } catch (e) {
    console.log('[cartController] removeItem error:', { message: e.message });
    next(e);
  }
};

// DELETE /api/v1/cart/:sessionId
const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.params.sessionId);
    res.json({ success: true, data: cart });
  } catch (e) {
    console.log('[cartController] clearCart error:', { message: e.message });
    next(e);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
