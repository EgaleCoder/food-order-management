/**
 * Component tests – CheckoutPage
 * Tests form rendering, real-time validation, payment selection,
 * submit gating, and successful order placement flow.
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CheckoutPage from '../../src/pages/CheckoutPage';

// ── Mocks ─────────────────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('../../src/context/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../../src/context/OrdersContext', () => ({
  useOrders: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { useCart } = require('../../src/context/CartContext');
const { useOrders } = require('../../src/context/OrdersContext');
const { toast } = require('react-toastify');

// ── Fixtures ──────────────────────────────────────────────────────
const cartItem = { _id: 'id1', name: 'Burger', price: 150, imageUrl: '', quantity: 2 };
const mockClearCart = jest.fn();
const mockAddLocalOrder = jest.fn();

const setupMocks = (cartItems = [cartItem]) => {
  useCart.mockReturnValue({
    cart: cartItems,
    totalAmount: cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
    clearCart: mockClearCart,
  });
  useOrders.mockReturnValue({ addLocalOrder: mockAddLocalOrder });
};

// Valid form values
const validFormValues = {
  customerName: 'Riya Sharma',
  phone: '9876543210',
  address: '12 MG Road, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
};

const fillForm = async (user, overrides = {}) => {
  const values = { ...validFormValues, ...overrides };
  await user.type(screen.getByPlaceholderText('John Doe'), values.customerName);
  await user.type(screen.getByPlaceholderText('9876543210'), values.phone);
  await user.type(screen.getByPlaceholderText('House No., Street, Area'), values.address);
  await user.type(screen.getByPlaceholderText('Mumbai'), values.city);
  await user.type(screen.getByPlaceholderText('Maharashtra'), values.state);
  await user.type(screen.getByPlaceholderText('400001'), values.zipCode);
};

const renderCheckout = () =>
  render(
    <MemoryRouter>
      <CheckoutPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

// ──────────────────────────────────────────────────────────────────
// Rendering
// ──────────────────────────────────────────────────────────────────
describe('CheckoutPage – rendering', () => {
  it('renders the page heading', () => {
    renderCheckout();
    expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
  });

  it('shows cart item count and total in summary bar', () => {
    renderCheckout();
    expect(screen.getByText(/1 item\(s\) in cart/i)).toBeInTheDocument();
    expect(screen.getByText(/Total: ₹300/)).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    renderCheckout();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('9876543210')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('House No., Street, Area')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mumbai')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Maharashtra')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('400001')).toBeInTheDocument();
  });

  it('renders three payment method options', () => {
    renderCheckout();
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(screen.getByText('Net Banking')).toBeInTheDocument();
    expect(screen.getByText('Cash on Delivery')).toBeInTheDocument();
  });

  it('disables submit button when cart is empty', () => {
    setupMocks([]);
    renderCheckout();
    expect(screen.getByRole('button', { name: /place order/i })).toBeDisabled();
  });
});

// ──────────────────────────────────────────────────────────────────
// Form validation
// ──────────────────────────────────────────────────────────────────
describe('CheckoutPage – form validation', () => {
  it('shows errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /place order/i }));
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('shows inline error when phone is blurred with invalid value', async () => {
    const user = userEvent.setup();
    renderCheckout();

    const phoneInput = screen.getByPlaceholderText('9876543210');
    await act(async () => {
      await user.type(phoneInput, '123');
      await user.tab(); // trigger blur
    });

    expect(screen.getByText(/valid 10-digit/i)).toBeInTheDocument();
  });

  it('clears phone error when valid phone is entered', async () => {
    const user = userEvent.setup();
    renderCheckout();

    const phoneInput = screen.getByPlaceholderText('9876543210');
    await act(async () => {
      await user.type(phoneInput, '123');
      await user.tab();
    });
    expect(screen.getByText(/valid 10-digit/i)).toBeInTheDocument();

    await act(async () => {
      await user.clear(phoneInput);
      await user.type(phoneInput, '9876543210');
    });
    expect(screen.queryByText(/valid 10-digit/i)).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────
// Payment method selection
// ──────────────────────────────────────────────────────────────────
describe('CheckoutPage – payment method', () => {
  it('selects UPI when UPI radio is clicked', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await user.click(screen.getByText('UPI').closest('label'));
    });

    expect(screen.getByDisplayValue('UPI')).toBeChecked();
  });

  it('switches payment method when a different option is selected', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await user.click(screen.getByText('UPI').closest('label'));
    });
    await act(async () => {
      await user.click(screen.getByText('Net Banking').closest('label'));
    });

    expect(screen.getByDisplayValue('Net Banking')).toBeChecked();
    expect(screen.getByDisplayValue('UPI')).not.toBeChecked();
  });
});

// ──────────────────────────────────────────────────────────────────
// Successful order placement
// ──────────────────────────────────────────────────────────────────
describe('CheckoutPage – successful order placement', () => {
  it('creates a local order, clears the cart, and navigates away', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await fillForm(user);
      await user.click(screen.getByText('UPI').closest('label'));
      await user.click(screen.getByRole('button', { name: /place order/i }));
    });

    await waitFor(() => {
      expect(mockAddLocalOrder).toHaveBeenCalledTimes(1);
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/orders/'));
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('sets paymentStatus to Pending for Cash on Delivery', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await fillForm(user);
      await user.click(screen.getByText('Cash on Delivery').closest('label'));
      await user.click(screen.getByRole('button', { name: /place order/i }));
    });

    await waitFor(() => {
      const order = mockAddLocalOrder.mock.calls[0][0];
      expect(order.paymentStatus).toBe('Pending');
    });
  });

  it('sets paymentStatus to Paid for UPI', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await fillForm(user);
      await user.click(screen.getByText('UPI').closest('label'));
      await user.click(screen.getByRole('button', { name: /place order/i }));
    });

    await waitFor(() => {
      const order = mockAddLocalOrder.mock.calls[0][0];
      expect(order.paymentStatus).toBe('Paid');
    });
  });

  it('includes all cart items in the created order', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await act(async () => {
      await fillForm(user);
      await user.click(screen.getByText('UPI').closest('label'));
      await user.click(screen.getByRole('button', { name: /place order/i }));
    });

    await waitFor(() => {
      const order = mockAddLocalOrder.mock.calls[0][0];
      expect(order.items).toHaveLength(1);
      expect(order.items[0].name).toBe('Burger');
      expect(order.items[0].quantity).toBe(2);
    });
  });
});
