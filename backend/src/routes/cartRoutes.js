const express = require('express');
const router = express.Router();
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

// Cart routes
// Get cart details => GET /api/v1/cart/:sessionId
router.get('/:sessionId',                       getCart);
// Add item to cart => POST /api/v1/cart/:sessionId/items
router.post('/:sessionId/items',                addItem);

// Update item in cart => PATCH /api/v1/cart/:sessionId/items/:menuItemId
router.patch('/:sessionId/items/:menuItemId',   updateItem);

// Remove item from cart => DELETE /api/v1/cart/:sessionId/items/:menuItemId
router.delete('/:sessionId/items/:menuItemId',  removeItem);

// Clear entire cart => DELETE /api/v1/cart/:sessionId
router.delete('/:sessionId',                    clearCart);

module.exports = router;
