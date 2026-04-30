// Cart service: Handles cart operations like add/update/remove items, clear cart, etc.
const Cart = require('../models/cartModel');


// Get or create a cart for a session 
const getCart = async (sessionId) => {
  // logger.debug(`[cartService] getCart: ${sessionId}`);
  let cart = await Cart.findOne({ sessionId });
  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] });
    // logger.info(`[cartService] Created new cart for session: ${sessionId}`);
  }
  return cart;
};

// Add or increment an item.
// If the item already exists, increment quantity by the given qty (default 1).

const addItem = async (sessionId, { menuItemId, name, price, imageUrl, quantity = 1 }) => {
  console.log(`[cartService] addItem: ${name} (x${quantity}) to session ${sessionId}`);
  const cart = await getCart(sessionId);

  const existing = cart.items.find((i) => i.menuItem.toString() === menuItemId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ menuItem: menuItemId, name, price, imageUrl, quantity });
  }
  return cart.save();
};

// Update quantity of an item. Removes item if qty <= 0
const updateItem = async (sessionId, menuItemId, quantity) => {
  console.log(`[cartService] updateItem: ${menuItemId} → qty ${quantity} for session ${sessionId}`);
  const cart = await getCart(sessionId);

  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => i.menuItem.toString() !== menuItemId);
  } else {
    const item = cart.items.find((i) => i.menuItem.toString() === menuItemId);
    if (item) item.quantity = quantity;
  }
  return cart.save();
};

// Remove a single item from the cart
const removeItem = async (sessionId, menuItemId) => {
  console.log(`[cartService] removeItem: ${menuItemId} from session ${sessionId}`);
  const cart = await getCart(sessionId);
  cart.items = cart.items.filter((i) => i.menuItem.toString() !== menuItemId);
  return cart.save();
};

// Clear all items from the cart
const clearCart = async (sessionId) => {
  console.log(`[cartService] clearCart: session ${sessionId}`);
  return Cart.findOneAndUpdate(
    { sessionId },
    { items: [] },
    { new: true, upsert: true },
  );
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
