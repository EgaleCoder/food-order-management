/**
 * Unit tests – Validation Middleware (Joi schemas)
 * Tests the Joi schemas directly without Express; fast and reliable.
 */
'use strict';

const { createOrderSchema, updateOrderStatusSchema } = require('../../../src/middlewares/validationSchemas');

// ── Fixture ───────────────────────────────────────────────────────
const VALID_MENU_ID = '507f1f77bcf86cd799439011';

const validOrderBody = {
  customerName: 'Riya Sharma',
  phone: '9876543210',
  address: '12 MG Road, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  items: [{ menuItemId: VALID_MENU_ID, quantity: 2 }],
};

// Helper – validate and return error key list
const errKeys = (schema, body) => {
  const { error } = schema.validate(body, { abortEarly: false });
  return error ? error.details.map((d) => d.context.key || d.message) : [];
};

// ──────────────────────────────────────────────────────────────────
// createOrderSchema
// ──────────────────────────────────────────────────────────────────
describe('createOrderSchema – valid payload', () => {
  it('passes validation for a complete correct payload', () => {
    const { error } = createOrderSchema.validate(validOrderBody);
    expect(error).toBeUndefined();
  });

  it('passes when optional status is included', () => {
    const { error } = createOrderSchema.validate({ ...validOrderBody, status: 'Delivered' });
    expect(error).toBeUndefined();
  });

  it('passes when optional cartSessionId is included', () => {
    const { error } = createOrderSchema.validate({ ...validOrderBody, cartSessionId: 'sess-abc' });
    expect(error).toBeUndefined();
  });
});

describe('createOrderSchema – customerName validation', () => {
  it('rejects empty customerName', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, customerName: '' });
    expect(keys).toContain('customerName');
  });

  it('rejects name shorter than 2 chars', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, customerName: 'A' });
    expect(keys).toContain('customerName');
  });

  it('rejects name with invalid characters (digits)', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, customerName: 'Riya123' });
    expect(keys).toContain('customerName');
  });

  it('rejects name longer than 80 characters', () => {
    const longName = 'A'.repeat(81);
    const keys = errKeys(createOrderSchema, { ...validOrderBody, customerName: longName });
    expect(keys).toContain('customerName');
  });

  it('accepts name with spaces, apostrophes, dots', () => {
    const { error } = createOrderSchema.validate({ ...validOrderBody, customerName: "O'Brien Jr." });
    expect(error).toBeUndefined();
  });
});

describe('createOrderSchema – phone validation', () => {
  it('rejects a number starting with 5', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, phone: '5876543210' });
    expect(keys).toContain('phone');
  });

  it('rejects a number with fewer than 10 digits', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, phone: '98765432' });
    expect(keys).toContain('phone');
  });

  it('accepts a valid 10-digit number starting with 9', () => {
    const { error } = createOrderSchema.validate({ ...validOrderBody, phone: '9123456789' });
    expect(error).toBeUndefined();
  });

  it('accepts valid numbers starting 6, 7, 8, 9', () => {
    ['6', '7', '8', '9'].forEach((prefix) => {
      const { error } = createOrderSchema.validate({
        ...validOrderBody,
        phone: `${prefix}123456789`,
      });
      expect(error).toBeUndefined();
    });
  });
});

describe('createOrderSchema – address / city / state / zipCode', () => {
  it('rejects address shorter than 5 chars', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, address: 'MG' });
    expect(keys).toContain('address');
  });

  it('rejects empty city', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, city: '' });
    expect(keys).toContain('city');
  });

  it('rejects empty state', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, state: '' });
    expect(keys).toContain('state');
  });

  it('rejects non-6-digit zipCode', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, zipCode: '12345' });
    expect(keys).toContain('zipCode');
  });

  it('rejects alphanumeric zipCode', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, zipCode: '40000A' });
    expect(keys).toContain('zipCode');
  });
});

describe('createOrderSchema – payment fields', () => {
  it('rejects invalid paymentMethod', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, paymentMethod: 'Bitcoin' });
    expect(keys).toContain('paymentMethod');
  });

  it('rejects invalid paymentStatus', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, paymentStatus: 'Processing' });
    expect(keys).toContain('paymentStatus');
  });

  it('accepts all three payment methods', () => {
    ['UPI', 'Net Banking', 'Cash on Delivery'].forEach((method) => {
      const { error } = createOrderSchema.validate({ ...validOrderBody, paymentMethod: method });
      expect(error).toBeUndefined();
    });
  });

  it('accepts both payment statuses', () => {
    ['Paid', 'Pending'].forEach((status) => {
      const { error } = createOrderSchema.validate({ ...validOrderBody, paymentStatus: status });
      expect(error).toBeUndefined();
    });
  });
});

describe('createOrderSchema – items array', () => {
  it('rejects empty items array', () => {
    const keys = errKeys(createOrderSchema, { ...validOrderBody, items: [] });
    expect(keys.length).toBeGreaterThan(0);
  });

  it('rejects item with invalid menuItemId format', () => {
    const { error } = createOrderSchema.validate({
      ...validOrderBody,
      items: [{ menuItemId: 'not-an-objectid', quantity: 1 }],
    });
    expect(error).toBeDefined();
  });

  it('rejects item with quantity 0', () => {
    const { error } = createOrderSchema.validate({
      ...validOrderBody,
      items: [{ menuItemId: VALID_MENU_ID, quantity: 0 }],
    });
    expect(error).toBeDefined();
  });

  it('rejects item with quantity > 20', () => {
    const { error } = createOrderSchema.validate({
      ...validOrderBody,
      items: [{ menuItemId: VALID_MENU_ID, quantity: 21 }],
    });
    expect(error).toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────────
// updateOrderStatusSchema
// ──────────────────────────────────────────────────────────────────
describe('updateOrderStatusSchema', () => {
  const validStatuses = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

  it.each(validStatuses)('accepts status: "%s"', (status) => {
    const { error } = updateOrderStatusSchema.validate({ status });
    expect(error).toBeUndefined();
  });

  it('rejects an unknown status', () => {
    const { error } = updateOrderStatusSchema.validate({ status: 'Shipped' });
    expect(error).toBeDefined();
  });

  it('rejects missing status field', () => {
    const { error } = updateOrderStatusSchema.validate({});
    expect(error).toBeDefined();
  });
});
