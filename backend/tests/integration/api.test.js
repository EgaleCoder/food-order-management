/**
 * Integration tests – REST API routes via supertest
 *
 * The database is NOT used; every service call is mocked so these
 * tests focus on HTTP contract: routing, status codes, response shapes
 * and error-handler behaviour.
 */
'use strict';

// ── Mock ALL services before requiring the app ────────────────────
jest.mock('../../src/services/menuService');
jest.mock('../../src/services/cartService');
jest.mock('../../src/services/orderService');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const request = require('supertest');
const app = require('../../src/app');
const menuService = require('../../src/services/menuService');
const cartService = require('../../src/services/cartService');
const orderService = require('../../src/services/orderService');

// ── Fixtures ──────────────────────────────────────────────────────
const MENU_ITEM_ID = '507f1f77bcf86cd799439011';
const ORDER_ID = '507f1f77bcf86cd799439099';
const SESSION_ID = 'sess-integration-abc';

const sampleMenuItem = {
  _id: MENU_ITEM_ID,
  name: 'Paneer Tikka',
  price: 249,
  category: 'Starters',
  isAvailable: true,
};

const sampleOrder = {
  _id: ORDER_ID,
  customerName: 'Test User',
  phone: '9876543210',
  totalAmount: 498,
  status: 'Order Received',
  items: [{ menuItem: MENU_ITEM_ID, name: 'Paneer Tikka', price: 249, quantity: 2 }],
};

const sampleCart = {
  sessionId: SESSION_ID,
  items: [{ menuItem: MENU_ITEM_ID, name: 'Paneer Tikka', price: 249, quantity: 1 }],
};

beforeEach(() => jest.clearAllMocks());

// ──────────────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────────────
describe('GET /api/v1/health', () => {
  it('returns 200 with status OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'OK' });
  });
});

// ──────────────────────────────────────────────────────────────────
// Menu Routes
// ──────────────────────────────────────────────────────────────────
describe('GET /api/v1/menu', () => {
  it('200 – returns list of menu items', async () => {
    menuService.getAllItems.mockResolvedValue([sampleMenuItem]);

    const res = await request(app).get('/api/v1/menu');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe('Paneer Tikka');
  });

  it('500 – propagates service error', async () => {
    menuService.getAllItems.mockRejectedValue(new Error('DB failure'));

    const res = await request(app).get('/api/v1/menu');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/menu/:id', () => {
  it('200 – returns a single item', async () => {
    menuService.getItemById.mockResolvedValue(sampleMenuItem);

    const res = await request(app).get(`/api/v1/menu/${MENU_ITEM_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(MENU_ITEM_ID);
  });

  it('404 – when item not found', async () => {
    menuService.getItemById.mockResolvedValue(null);

    const res = await request(app).get(`/api/v1/menu/${MENU_ITEM_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────
// Cart Routes
// ──────────────────────────────────────────────────────────────────
describe('GET /api/v1/cart/:sessionId', () => {
  it('200 – returns cart for session', async () => {
    cartService.getCart.mockResolvedValue(sampleCart);

    const res = await request(app).get(`/api/v1/cart/${SESSION_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBe(SESSION_ID);
  });
});

describe('POST /api/v1/cart/:sessionId/items', () => {
  it('200 – adds item to cart', async () => {
    cartService.addItem.mockResolvedValue(sampleCart);

    const res = await request(app)
      .post(`/api/v1/cart/${SESSION_ID}/items`)
      .send({ menuItemId: MENU_ITEM_ID, name: 'Paneer Tikka', price: 249, quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PATCH /api/v1/cart/:sessionId/items/:menuItemId', () => {
  it('200 – updates item quantity', async () => {
    const updated = { ...sampleCart, items: [{ ...sampleCart.items[0], quantity: 3 }] };
    cartService.updateItem.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/v1/cart/${SESSION_ID}/items/${MENU_ITEM_ID}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('DELETE /api/v1/cart/:sessionId/items/:menuItemId', () => {
  it('200 – removes item from cart', async () => {
    cartService.removeItem.mockResolvedValue({ ...sampleCart, items: [] });

    const res = await request(app).delete(`/api/v1/cart/${SESSION_ID}/items/${MENU_ITEM_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});

describe('DELETE /api/v1/cart/:sessionId', () => {
  it('200 – clears entire cart', async () => {
    cartService.clearCart.mockResolvedValue({ sessionId: SESSION_ID, items: [] });

    const res = await request(app).delete(`/api/v1/cart/${SESSION_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────
// Order Routes
// ──────────────────────────────────────────────────────────────────
const validOrderBody = {
  customerName: 'Riya Sharma',
  phone: '9876543210',
  address: '12 MG Road, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  items: [{ menuItemId: MENU_ITEM_ID, quantity: 2 }],
};

describe('GET /api/v1/orders', () => {
  it('200 – returns all orders', async () => {
    orderService.getAllOrders.mockResolvedValue([sampleOrder]);

    const res = await request(app).get('/api/v1/orders');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(ORDER_ID);
  });
});

describe('GET /api/v1/orders/:id', () => {
  it('200 – returns a specific order', async () => {
    orderService.getOrderById.mockResolvedValue(sampleOrder);

    const res = await request(app).get(`/api/v1/orders/${ORDER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data.customerName).toBe('Test User');
  });

  it('404 – returns not found for unknown order ID', async () => {
    orderService.getOrderById.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/orders/nonexistentId');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/orders', () => {
  it('201 – creates a new order with valid body', async () => {
    orderService.createOrder.mockResolvedValue(sampleOrder);

    const res = await request(app).post('/api/v1/orders').send(validOrderBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(ORDER_ID);
  });

  it('400 – rejects invalid payload (missing customerName)', async () => {
    const { customerName: _omit, ...incomplete } = validOrderBody;
    const res = await request(app).post('/api/v1/orders').send(incomplete);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('400 – rejects invalid phone number', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ ...validOrderBody, phone: '1234567890' });

    expect(res.status).toBe(400);
  });

  it('400 – rejects empty items array', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ ...validOrderBody, items: [] });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/orders/:id/status', () => {
  it('200 – updates order status', async () => {
    const updated = { ...sampleOrder, status: 'Preparing' };
    orderService.updateOrderStatus.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/api/v1/orders/${ORDER_ID}/status`)
      .send({ status: 'Preparing' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Preparing');
  });

  it('400 – rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${ORDER_ID}/status`)
      .send({ status: 'Ghost' });

    expect(res.status).toBe(400);
  });

  it('404 – returns 404 when order not found', async () => {
    orderService.updateOrderStatus.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/v1/orders/nonexistentId/status')
      .send({ status: 'Delivered' });

    expect(res.status).toBe(404);
  });
});

// ──────────────────────────────────────────────────────────────────
// Error Handler
// ──────────────────────────────────────────────────────────────────
describe('404 for unknown routes', () => {
  it('returns 404 for unregistered endpoint', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
