/**
 * Frontend field-level validation for the checkout form.
 * Mirrors the backend Joi rules so errors show instantly without a round-trip.
 */

export const FIELD_RULES = {
  customerName: {
    label: 'Full Name',
    validate: (v) => {
      if (!v.trim()) return 'Full name is required';
      if (v.trim().length < 2) return 'Name must be at least 2 characters';
      if (v.trim().length > 80) return 'Name cannot exceed 80 characters';
      if (!/^[a-zA-Z\s.'-]+$/.test(v.trim())) return 'Name can only contain letters, spaces and basic punctuation';
      return null;
    },
  },
  phone: {
    label: 'Phone Number',
    validate: (v) => {
      if (!v.trim()) return 'Phone number is required';
      if (!/^[6-9]\d{9}$/.test(v.trim())) return 'Enter a valid 10-digit Indian mobile number (starting 6–9)';
      return null;
    },
  },
  address: {
    label: 'Street Address',
    validate: (v) => {
      if (!v.trim()) return 'Delivery address is required';
      if (v.trim().length < 5) return 'Address must be at least 5 characters';
      return null;
    },
  },
  city: {
    label: 'City',
    validate: (v) => {
      if (!v.trim()) return 'City is required';
      if (v.trim().length < 2) return 'Enter a valid city name';
      return null;
    },
  },
  state: {
    label: 'State',
    validate: (v) => {
      if (!v.trim()) return 'State is required';
      return null;
    },
  },
  zipCode: {
    label: 'ZIP / PIN Code',
    validate: (v) => {
      if (!v.trim()) return 'ZIP / PIN code is required';
      if (!/^\d{6}$/.test(v.trim())) return 'Enter a valid 6-digit PIN code';
      return null;
    },
  },
  paymentMethod: {
    label: 'Payment Method',
    validate: (v) => {
      if (!v) return 'Please select a payment method';
      const valid = ['UPI', 'Net Banking', 'Cash on Delivery'];
      if (!valid.includes(v)) return 'Invalid payment method selected';
      return null;
    },
  },
};

/** Validate all fields and return { fieldErrors, isValid } */
export const validateCheckoutForm = (form) => {
  const fieldErrors = {};
  let isValid = true;

  Object.entries(FIELD_RULES).forEach(([field, rule]) => {
    const err = rule.validate(form[field] ?? '');
    if (err) {
      fieldErrors[field] = err;
      isValid = false;
    }
  });

  return { fieldErrors, isValid };
};

/** Validate a single field on blur/change */
export const validateField = (field, value) => {
  return FIELD_RULES[field]?.validate(value) ?? null;
};
