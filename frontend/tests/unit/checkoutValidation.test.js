/**
 * Unit tests – checkoutValidation utility
 * Pure function tests; no rendering required.
 */

import {
  validateCheckoutForm,
  validateField,
  FIELD_RULES,
} from '../../src/utils/checkoutValidation';

// ──────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────
const validForm = {
  customerName: 'Riya Sharma',
  phone: '9876543210',
  address: '12 MG Road, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  paymentMethod: 'UPI',
};

// ──────────────────────────────────────────────────────────────────
// validateCheckoutForm
// ──────────────────────────────────────────────────────────────────
describe('validateCheckoutForm', () => {
  it('returns isValid true for a fully correct form', () => {
    const { isValid, fieldErrors } = validateCheckoutForm(validForm);
    expect(isValid).toBe(true);
    expect(Object.keys(fieldErrors)).toHaveLength(0);
  });

  it('returns isValid false and populates fieldErrors for empty form', () => {
    const empty = Object.fromEntries(Object.keys(validForm).map((k) => [k, '']));
    const { isValid, fieldErrors } = validateCheckoutForm(empty);
    expect(isValid).toBe(false);
    expect(Object.keys(fieldErrors).length).toBeGreaterThan(0);
  });

  it('collects errors for all invalid fields simultaneously', () => {
    const bad = {
      customerName: 'A',           // too short
      phone: '1234',               // invalid
      address: 'MG',               // too short
      city: 'X',                   // too short
      state: '',                   // empty
      zipCode: '1234',             // not 6 digits
      paymentMethod: 'Bitcoin',    // invalid
    };
    const { isValid, fieldErrors } = validateCheckoutForm(bad);
    expect(isValid).toBe(false);
    expect(fieldErrors).toHaveProperty('customerName');
    expect(fieldErrors).toHaveProperty('phone');
    expect(fieldErrors).toHaveProperty('address');
    expect(fieldErrors).toHaveProperty('zipCode');
    expect(fieldErrors).toHaveProperty('paymentMethod');
  });

  it('only flags the invalid field when one field is wrong', () => {
    const { isValid, fieldErrors } = validateCheckoutForm({ ...validForm, phone: '1234' });
    expect(isValid).toBe(false);
    expect(fieldErrors).toHaveProperty('phone');
    expect(fieldErrors).not.toHaveProperty('customerName');
  });
});

// ──────────────────────────────────────────────────────────────────
// validateField – customerName
// ──────────────────────────────────────────────────────────────────
describe('validateField – customerName', () => {
  it('returns null for a valid name', () => {
    expect(validateField('customerName', 'John Doe')).toBeNull();
  });

  it('errors on empty string', () => {
    expect(validateField('customerName', '')).toBeTruthy();
  });

  it('errors on single character name', () => {
    expect(validateField('customerName', 'A')).toBeTruthy();
  });

  it('errors when name contains digits', () => {
    expect(validateField('customerName', 'John123')).toBeTruthy();
  });

  it('accepts name with apostrophe and dot (e.g. O\'Brien Jr.)', () => {
    expect(validateField('customerName', "O'Brien Jr.")).toBeNull();
  });

  it('errors when name exceeds 80 chars', () => {
    expect(validateField('customerName', 'A'.repeat(81))).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────
// validateField – phone
// ──────────────────────────────────────────────────────────────────
describe('validateField – phone', () => {
  it('returns null for a valid 10-digit number starting with 9', () => {
    expect(validateField('phone', '9876543210')).toBeNull();
  });

  it.each(['6', '7', '8', '9'])('accepts numbers starting with %s', (d) => {
    expect(validateField('phone', `${d}123456789`)).toBeNull();
  });

  it('errors on number starting with 5', () => {
    expect(validateField('phone', '5876543210')).toBeTruthy();
  });

  it('errors on 9-digit number', () => {
    expect(validateField('phone', '987654321')).toBeTruthy();
  });

  it('errors on 11-digit number', () => {
    expect(validateField('phone', '98765432109')).toBeTruthy();
  });

  it('errors on empty value', () => {
    expect(validateField('phone', '')).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────
// validateField – address
// ──────────────────────────────────────────────────────────────────
describe('validateField – address', () => {
  it('returns null for a valid address', () => {
    expect(validateField('address', '12 MG Road, Andheri East')).toBeNull();
  });

  it('errors on empty address', () => {
    expect(validateField('address', '')).toBeTruthy();
  });

  it('errors on address shorter than 5 chars', () => {
    expect(validateField('address', 'Home')).toBeTruthy();
  });

  it('accepts exactly 5 characters', () => {
    expect(validateField('address', 'A'.repeat(5))).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────
// validateField – zipCode
// ──────────────────────────────────────────────────────────────────
describe('validateField – zipCode', () => {
  it('returns null for a valid 6-digit PIN', () => {
    expect(validateField('zipCode', '400001')).toBeNull();
  });

  it('errors on 5-digit code', () => {
    expect(validateField('zipCode', '40000')).toBeTruthy();
  });

  it('errors on 7-digit code', () => {
    expect(validateField('zipCode', '4000011')).toBeTruthy();
  });

  it('errors on alphanumeric PIN', () => {
    expect(validateField('zipCode', '40000A')).toBeTruthy();
  });

  it('errors on empty value', () => {
    expect(validateField('zipCode', '')).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────
// validateField – paymentMethod
// ──────────────────────────────────────────────────────────────────
describe('validateField – paymentMethod', () => {
  it.each(['UPI', 'Net Banking', 'Cash on Delivery'])('accepts "%s"', (method) => {
    expect(validateField('paymentMethod', method)).toBeNull();
  });

  it('errors on invalid method', () => {
    expect(validateField('paymentMethod', 'Bitcoin')).toBeTruthy();
  });

  it('errors on empty string', () => {
    expect(validateField('paymentMethod', '')).toBeTruthy();
  });
});

// ──────────────────────────────────────────────────────────────────
// validateField – unknown field
// ──────────────────────────────────────────────────────────────────
describe('validateField – unknown field', () => {
  it('returns null for an unregistered field key', () => {
    expect(validateField('unknownField', 'anything')).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────
// FIELD_RULES – structural assertion
// ──────────────────────────────────────────────────────────────────
describe('FIELD_RULES', () => {
  it('exports a validate function for every expected field', () => {
    const expectedFields = ['customerName', 'phone', 'address', 'city', 'state', 'zipCode', 'paymentMethod'];
    expectedFields.forEach((field) => {
      expect(FIELD_RULES[field]).toBeDefined();
      expect(typeof FIELD_RULES[field].validate).toBe('function');
    });
  });
});
