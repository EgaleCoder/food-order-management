/**
 * Unit tests – Order & Cart Controllers
 * Express req/res are mocked; services are replaced with jest.fn().
 */
'use strict';

jest.mock('../../../src/services/orderService');
jest.mock('../../../src/services/cartService');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const orderService = require('../../../src/services/orderService');
const cartService = require('../../../src/services/cartService');
const { getOrders, getOrderById, createOrder, updateOrderStatus } =
  require('../../../src/controllers/orderController');
const { getCart, addItem, updateItem, removeItem, clearCart } =
  require('../../../src/controllers/cartController');

// ── Mock req / res / next factory ────────────────────────────────
const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

// ──────────────────────────────────────────────────────────────────
// Order Controller
// ──────────────────────────────────────────────────────────────────
describe('orderController.getOrders', () => {
  it('responds 200 with the list returned by service', async () => {
    const orders = [{ _id: 'o1' }, { _id: 'o2' }];
    orderService.getAllOrders.mockResolvedValue(orders);

    const req = mockReq();
    const res = mockRes();

    await getOrders(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: orders });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next(error) when service throws', async () => {
    const err = new Error('DB down');
    orderService.getAllOrders.mockRejectedValue(err);

    await getOrders(mockReq(), mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

describe('orderController.getOrderById', () => {
  it('responds with order when found', async () => {
    const order = { _id: 'o1', status: 'Preparing' };
    orderService.getOrderById.mockResolvedValue(order);

    const req = mockReq({ params: { id: 'o1' } });
    const res = mockRes();

    await getOrderById(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: order });
  });

  it('sets status 404 and calls next when order not found', async () => {
    orderService.getOrderById.mockResolvedValue(null);

    const req = mockReq({ params: { id: 'nonexistent' } });
    const res = mockRes();

    await getOrderById(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('orderController.createOrder', () => {
  it('responds 201 with created order', async () => {
    const newOrder = { _id: 'o99', totalAmount: 598 };
    orderService.createOrder.mockResolvedValue(newOrder);

    const req = mockReq({ body: { customerName: 'Test' } });
    const res = mockRes();

    await createOrder(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: newOrder });
  });

  it('calls next(error) on service failure', async () => {
    orderService.createOrder.mockRejectedValue(new Error('Validation error'));

    await createOrder(mockReq(), mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('orderController.updateOrderStatus', () => {
  it('responds with updated order', async () => {
    const updated = { _id: 'o1', status: 'Out for Delivery' };
    orderService.updateOrderStatus.mockResolvedValue(updated);

    const req = mockReq({ params: { id: 'o1' }, body: { status: 'Out for Delivery' } });
    const res = mockRes();

    await updateOrderStatus(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it('responds 404 when order not found for update', async () => {
    orderService.updateOrderStatus.mockResolvedValue(null);

    const req = mockReq({ params: { id: 'bad' }, body: { status: 'Delivered' } });
    const res = mockRes();

    await updateOrderStatus(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ──────────────────────────────────────────────────────────────────
// Cart Controller
// ──────────────────────────────────────────────────────────────────
describe('cartController.getCart', () => {
  it('responds with cart data', async () => {
    const cart = { sessionId: 'sess-1', items: [] };
    cartService.getCart.mockResolvedValue(cart);

    const req = mockReq({ params: { sessionId: 'sess-1' } });
    const res = mockRes();

    await getCart(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: cart });
  });

  it('passes error to next() when service throws', async () => {
    cartService.getCart.mockRejectedValue(new Error('DB error'));
    await getCart(mockReq({ params: { sessionId: 'x' } }), mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('cartController.addItem', () => {
  it('responds with updated cart after adding item', async () => {
    const updatedCart = { sessionId: 'sess-1', items: [{ name: 'Burger', quantity: 1 }] };
    cartService.addItem.mockResolvedValue(updatedCart);

    const req = mockReq({
      params: { sessionId: 'sess-1' },
      body: { menuItemId: 'id1', name: 'Burger', price: 150, quantity: 1 },
    });
    const res = mockRes();

    await addItem(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedCart });
  });
});

describe('cartController.updateItem', () => {
  it('updates quantity and responds with updated cart', async () => {
    const updatedCart = { sessionId: 'sess-1', items: [{ name: 'Burger', quantity: 3 }] };
    cartService.updateItem.mockResolvedValue(updatedCart);

    const req = mockReq({
      params: { sessionId: 'sess-1', menuItemId: 'id1' },
      body: { quantity: 3 },
    });
    const res = mockRes();

    await updateItem(req, res, mockNext);

    expect(cartService.updateItem).toHaveBeenCalledWith('sess-1', 'id1', 3);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedCart });
  });
});

describe('cartController.removeItem', () => {
  it('removes item and responds with updated cart', async () => {
    const updatedCart = { sessionId: 'sess-1', items: [] };
    cartService.removeItem.mockResolvedValue(updatedCart);

    const req = mockReq({ params: { sessionId: 'sess-1', menuItemId: 'id1' } });
    const res = mockRes();

    await removeItem(req, res, mockNext);

    expect(cartService.removeItem).toHaveBeenCalledWith('sess-1', 'id1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedCart });
  });
});

describe('cartController.clearCart', () => {
  it('clears cart and responds', async () => {
    const clearedCart = { sessionId: 'sess-1', items: [] };
    cartService.clearCart.mockResolvedValue(clearedCart);

    const req = mockReq({ params: { sessionId: 'sess-1' } });
    const res = mockRes();

    await clearCart(req, res, mockNext);

    expect(cartService.clearCart).toHaveBeenCalledWith('sess-1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: clearedCart });
  });
});
