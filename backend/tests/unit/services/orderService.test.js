/**
 * Unit tests – Order Service
 * Both Mongoose models and cartService are fully mocked.
 */
'use strict';

jest.mock('../../../src/models/orderModel');
jest.mock('../../../src/models/menuItemModel');
jest.mock('../../../src/services/cartService');
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const Order = require('../../../src/models/orderModel');
const MenuItem = require('../../../src/models/menuItemModel');
const cartService = require('../../../src/services/cartService');
const orderService = require('../../../src/services/orderService');

// ── Fixtures ──────────────────────────────────────────────────────
const MENU_ITEM_ID = '507f1f77bcf86cd799439011';
const ORDER_ID = '507f1f77bcf86cd799439099';

const mockMenuItem = {
  _id: MENU_ITEM_ID,
  name: 'Margherita Pizza',
  price: 299,
};

const validOrderPayload = {
  customerName: 'Riya Sharma',
  phone: '9876543210',
  address: '12 MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  items: [{ menuItemId: MENU_ITEM_ID, quantity: 2 }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────
// getAllOrders
// ──────────────────────────────────────────────────────────────────
describe('orderService.getAllOrders', () => {
  it('returns populated, descending list of orders', async () => {
    const fakeOrders = [{ _id: ORDER_ID, status: 'Delivered' }];
    const sortMock = jest.fn().mockResolvedValue(fakeOrders);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    Order.find.mockReturnValue({ populate: populateMock });

    const result = await orderService.getAllOrders();

    expect(Order.find).toHaveBeenCalledTimes(1);
    expect(populateMock).toHaveBeenCalledWith('items.menuItem', 'name price imageUrl');
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual(fakeOrders);
  });
});

// ──────────────────────────────────────────────────────────────────
// getOrderById
// ──────────────────────────────────────────────────────────────────
describe('orderService.getOrderById', () => {
  it('returns populated order for a valid ID', async () => {
    const fakeOrder = { _id: ORDER_ID, status: 'Preparing' };
    const populateMock = jest.fn().mockResolvedValue(fakeOrder);
    Order.findById.mockReturnValue({ populate: populateMock });

    const result = await orderService.getOrderById(ORDER_ID);

    expect(Order.findById).toHaveBeenCalledWith(ORDER_ID);
    expect(result).toEqual(fakeOrder);
  });

  it('returns null when order does not exist', async () => {
    const populateMock = jest.fn().mockResolvedValue(null);
    Order.findById.mockReturnValue({ populate: populateMock });

    const result = await orderService.getOrderById('nonexistentId');
    expect(result).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────
// createOrder
// ──────────────────────────────────────────────────────────────────
describe('orderService.createOrder', () => {
  it('creates order and returns it', async () => {
    MenuItem.findById.mockResolvedValue(mockMenuItem);
    const createdOrder = { _id: ORDER_ID, totalAmount: 598, status: 'Order Received' };
    Order.create.mockResolvedValue(createdOrder);

    const result = await orderService.createOrder(validOrderPayload);

    expect(MenuItem.findById).toHaveBeenCalledWith(MENU_ITEM_ID);
    expect(Order.create).toHaveBeenCalledTimes(1);

    const createArg = Order.create.mock.calls[0][0];
    expect(createArg.totalAmount).toBe(mockMenuItem.price * 2);   // 299 × 2
    expect(createArg.customerName).toBe('Riya Sharma');
    expect(createArg.shippingAddress.street).toBe('12 MG Road');
    expect(result).toEqual(createdOrder);
  });

  it('clears cart when cartSessionId is provided', async () => {
    MenuItem.findById.mockResolvedValue(mockMenuItem);
    Order.create.mockResolvedValue({ _id: ORDER_ID });
    cartService.clearCart.mockResolvedValue({});

    await orderService.createOrder({ ...validOrderPayload, cartSessionId: 'sess-xyz' });

    expect(cartService.clearCart).toHaveBeenCalledWith('sess-xyz');
  });

  it('does NOT clear cart when cartSessionId is absent', async () => {
    MenuItem.findById.mockResolvedValue(mockMenuItem);
    Order.create.mockResolvedValue({ _id: ORDER_ID });

    await orderService.createOrder(validOrderPayload);

    expect(cartService.clearCart).not.toHaveBeenCalled();
  });

  it('throws when a menuItem is not found in DB', async () => {
    MenuItem.findById.mockResolvedValue(null); // item not found

    await expect(orderService.createOrder(validOrderPayload)).rejects.toThrow(
      `Menu item not found: ${MENU_ITEM_ID}`,
    );
    expect(Order.create).not.toHaveBeenCalled();
  });

  it('sets custom status when provided in payload', async () => {
    MenuItem.findById.mockResolvedValue(mockMenuItem);
    Order.create.mockResolvedValue({ _id: ORDER_ID, status: 'Delivered' });

    await orderService.createOrder({ ...validOrderPayload, status: 'Delivered' });

    const createArg = Order.create.mock.calls[0][0];
    expect(createArg.status).toBe('Delivered');
  });
});

// ──────────────────────────────────────────────────────────────────
// updateOrderStatus
// ──────────────────────────────────────────────────────────────────
describe('orderService.updateOrderStatus', () => {
  it('calls findByIdAndUpdate with correct args', async () => {
    const updatedOrder = { _id: ORDER_ID, status: 'Out for Delivery' };
    Order.findByIdAndUpdate.mockResolvedValue(updatedOrder);

    const result = await orderService.updateOrderStatus(ORDER_ID, 'Out for Delivery');

    expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
      ORDER_ID,
      { status: 'Out for Delivery' },
      { new: true, runValidators: true },
    );
    expect(result).toEqual(updatedOrder);
  });

  it('returns null when order ID does not exist', async () => {
    Order.findByIdAndUpdate.mockResolvedValue(null);

    const result = await orderService.updateOrderStatus('badId', 'Delivered');
    expect(result).toBeNull();
  });
});
