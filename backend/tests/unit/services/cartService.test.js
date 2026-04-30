/**
 * Unit tests – Cart Service
 * All Mongoose model calls are mocked; no real DB is used.
 */
'use strict';

jest.mock('../../../src/models/cartModel');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const Cart = require('../../../src/models/cartModel');
const cartService = require('../../../src/services/cartService');

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
const SESSION = 'sess-abc123';
const ITEM_ID = '507f1f77bcf86cd799439011';

/** Build a minimal mock cart document */
const makeCart = (items = []) => {
  const cart = {
    sessionId: SESSION,
    items,
    save: jest.fn().mockResolvedValue({ sessionId: SESSION, items }),
  };
  return cart;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────
// getCart
// ──────────────────────────────────────────────────────────────────
describe('cartService.getCart', () => {
  it('returns existing cart when one is found', async () => {
    const existing = makeCart([]);
    Cart.findOne.mockResolvedValue(existing);

    const result = await cartService.getCart(SESSION);

    expect(Cart.findOne).toHaveBeenCalledWith({ sessionId: SESSION });
    expect(Cart.create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });

  it('creates and returns a new cart when none exists', async () => {
    Cart.findOne.mockResolvedValue(null);
    const fresh = makeCart([]);
    Cart.create.mockResolvedValue(fresh);

    const result = await cartService.getCart(SESSION);

    expect(Cart.create).toHaveBeenCalledWith({ sessionId: SESSION, items: [] });
    expect(result).toBe(fresh);
  });
});

// ──────────────────────────────────────────────────────────────────
// addItem
// ──────────────────────────────────────────────────────────────────
describe('cartService.addItem', () => {
  it('adds a new item when cart is empty', async () => {
    const cart = makeCart([]);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.addItem(SESSION, {
      menuItemId: ITEM_ID,
      name: 'Burger',
      price: 150,
      imageUrl: '/img.jpg',
      quantity: 2,
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe('Burger');
    expect(cart.save).toHaveBeenCalledTimes(1);
  });

  it('increments quantity when item already in cart', async () => {
    const existingItem = {
      menuItem: { toString: () => ITEM_ID },
      name: 'Burger',
      price: 150,
      quantity: 1,
    };
    const cart = makeCart([existingItem]);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.addItem(SESSION, {
      menuItemId: ITEM_ID,
      name: 'Burger',
      price: 150,
      imageUrl: '/img.jpg',
      quantity: 3,
    });

    expect(cart.items).toHaveLength(1);       // no new item pushed
    expect(existingItem.quantity).toBe(4);    // 1 + 3
    expect(cart.save).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────
// updateItem
// ──────────────────────────────────────────────────────────────────
describe('cartService.updateItem', () => {
  it('updates quantity of an existing item', async () => {
    const item = {
      menuItem: { toString: () => ITEM_ID },
      quantity: 2,
    };
    const cart = makeCart([item]);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.updateItem(SESSION, ITEM_ID, 5);

    expect(item.quantity).toBe(5);
    expect(cart.save).toHaveBeenCalledTimes(1);
  });

  it('removes item when quantity is set to 0', async () => {
    const item = { menuItem: { toString: () => ITEM_ID }, quantity: 2 };
    const cart = makeCart([item]);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.updateItem(SESSION, ITEM_ID, 0);

    expect(cart.items).toHaveLength(0);
    expect(cart.save).toHaveBeenCalledTimes(1);
  });

  it('removes item when quantity is negative', async () => {
    const item = { menuItem: { toString: () => ITEM_ID }, quantity: 2 };
    const cart = makeCart([item]);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.updateItem(SESSION, ITEM_ID, -1);

    expect(cart.items).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────
// removeItem
// ──────────────────────────────────────────────────────────────────
describe('cartService.removeItem', () => {
  it('removes the target item, leaving others intact', async () => {
    const OTHER_ID = '507f1f77bcf86cd799439022';
    const items = [
      { menuItem: { toString: () => ITEM_ID }, name: 'Burger', quantity: 1 },
      { menuItem: { toString: () => OTHER_ID }, name: 'Pizza', quantity: 2 },
    ];
    const cart = makeCart(items);
    Cart.findOne.mockResolvedValue(cart);

    await cartService.removeItem(SESSION, ITEM_ID);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe('Pizza');
    expect(cart.save).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────
// clearCart
// ──────────────────────────────────────────────────────────────────
describe('cartService.clearCart', () => {
  it('calls findOneAndUpdate with empty items array', async () => {
    const emptied = makeCart([]);
    Cart.findOneAndUpdate.mockResolvedValue(emptied);

    const result = await cartService.clearCart(SESSION);

    expect(Cart.findOneAndUpdate).toHaveBeenCalledWith(
      { sessionId: SESSION },
      { items: [] },
      { new: true, upsert: true },
    );
    expect(result).toBe(emptied);
  });
});
