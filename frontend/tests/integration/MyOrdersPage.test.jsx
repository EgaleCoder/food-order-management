/**
 * Component tests – MyOrdersPage
 * Tests the page renders correctly for different order states:
 * - empty state (no orders)
 * - active local orders (from OrdersContext)
 * - historical DB orders
 * - loading state
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MyOrdersPage from '../../src/pages/MyOrdersPage';

// ── Mock dependencies ─────────────────────────────────────────────
jest.mock('../../src/context/OrdersContext', () => ({
  useOrders: jest.fn(),
}));
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
}));

const { useOrders } = require('../../src/context/OrdersContext');

// ── Fixtures ──────────────────────────────────────────────────────
const now = new Date().toISOString();

const localOrder = {
  _id: 'local-order-abcdefgh',
  customerName: 'Riya Sharma',
  phone: '9876543210',
  address: '12 MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid',
  totalAmount: 498,
  status: 'Preparing',
  createdAt: now,
  items: [{ name: 'Pizza', price: 249, quantity: 2 }],
};

const dbOrder = {
  _id: 'db-order-12345678',
  customerName: 'Amit Kumar',
  phone: '7654321098',
  shippingAddress: { street: '5 Park Street', city: 'Kolkata', state: 'WB', zipCode: '700001' },
  paymentMethod: 'Net Banking',
  paymentStatus: 'Paid',
  totalAmount: 750,
  status: 'Delivered',
  createdAt: now,
  items: [{ name: 'Biryani', price: 375, quantity: 2 }],
};

// Helper to render with router
const renderPage = () =>
  render(
    <MemoryRouter>
      <MyOrdersPage />
    </MemoryRouter>,
  );

beforeEach(() => jest.clearAllMocks());

// ──────────────────────────────────────────────────────────────────
// Empty state
// ──────────────────────────────────────────────────────────────────
describe('MyOrdersPage – empty state', () => {
  beforeEach(() => {
    useOrders.mockReturnValue({
      localOrders: [],
      dbOrders: [],
      dbLoading: false,
      loadDbOrders: jest.fn(),
    });
  });

  it('renders the page title', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /my orders/i })).toBeInTheDocument();
  });

  it('shows the empty state message', () => {
    renderPage();
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  it('shows "Browse Menu" CTA link', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /browse menu/i })).toBeInTheDocument();
  });

  it('calls loadDbOrders on mount', async () => {
    const loadDbOrders = jest.fn();
    useOrders.mockReturnValue({ localOrders: [], dbOrders: [], dbLoading: false, loadDbOrders });
    renderPage();
    await waitFor(() => expect(loadDbOrders).toHaveBeenCalledTimes(1));
  });
});

// ──────────────────────────────────────────────────────────────────
// Loading state
// ──────────────────────────────────────────────────────────────────
describe('MyOrdersPage – loading state', () => {
  it('shows a loading spinner while DB orders are fetching', () => {
    useOrders.mockReturnValue({
      localOrders: [],
      dbOrders: [],
      dbLoading: true,
      loadDbOrders: jest.fn(),
    });
    renderPage();
    expect(screen.getByText(/loading order history/i)).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────
// Active local orders
// ──────────────────────────────────────────────────────────────────
describe('MyOrdersPage – active (local) orders', () => {
  beforeEach(() => {
    useOrders.mockReturnValue({
      localOrders: [localOrder],
      dbOrders: [],
      dbLoading: false,
      loadDbOrders: jest.fn(),
    });
  });

  it('renders the "Active Orders" section', () => {
    renderPage();
    expect(screen.getByText(/active orders/i)).toBeInTheDocument();
  });

  it('displays the last 8 chars of the order ID (uppercased)', () => {
    renderPage();
    expect(screen.getByText(`#${localOrder._id.slice(-8).toUpperCase()}`)).toBeInTheDocument();
  });

  it('shows current order status', () => {
    renderPage();
    expect(screen.getByText(/preparing/i)).toBeInTheDocument();
  });

  it('shows order total amount', () => {
    renderPage();
    expect(screen.getByText(/498/)).toBeInTheDocument();
  });

  it('reveals item details when order card is clicked', async () => {
    renderPage();
    const card = screen.getByText(`#${localOrder._id.slice(-8).toUpperCase()}`).closest('[class*="my-orders-card"]');
    await act(async () => {
      await userEvent.click(card);
    });
    expect(screen.getByText(/Riya Sharma/i)).toBeInTheDocument();
    expect(screen.getByText(/Track Order/i)).toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────
// Historical DB orders
// ──────────────────────────────────────────────────────────────────
describe('MyOrdersPage – historical DB orders', () => {
  beforeEach(() => {
    useOrders.mockReturnValue({
      localOrders: [],
      dbOrders: [dbOrder],
      dbLoading: false,
      loadDbOrders: jest.fn(),
    });
  });

  it('renders the "Order History" section', () => {
    renderPage();
    expect(screen.getByText(/order history/i)).toBeInTheDocument();
  });

  it('shows the DB order ID', () => {
    renderPage();
    expect(screen.getByText(`#${dbOrder._id.slice(-8).toUpperCase()}`)).toBeInTheDocument();
  });

  it('shows Delivered status', () => {
    renderPage();
    expect(screen.getByText(/delivered/i)).toBeInTheDocument();
  });

  it('expands to show shippingAddress (DB order shape)', async () => {
    renderPage();
    const card = screen.getByText(`#${dbOrder._id.slice(-8).toUpperCase()}`).closest('[class*="my-orders-card"]');
    await act(async () => {
      await userEvent.click(card);
    });
    expect(screen.getByText(/Park Street/i)).toBeInTheDocument();
  });

  it('does NOT show Track Order link for historical orders', async () => {
    renderPage();
    const card = screen.getByText(`#${dbOrder._id.slice(-8).toUpperCase()}`).closest('[class*="my-orders-card"]');
    await act(async () => {
      await userEvent.click(card);
    });
    expect(screen.queryByText(/Track Order/i)).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────────────────────────────────
// Mixed state (local + DB orders)
// ──────────────────────────────────────────────────────────────────
describe('MyOrdersPage – mixed orders', () => {
  it('renders both sections when local and DB orders exist', () => {
    useOrders.mockReturnValue({
      localOrders: [localOrder],
      dbOrders: [dbOrder],
      dbLoading: false,
      loadDbOrders: jest.fn(),
    });
    renderPage();
    expect(screen.getByText(/active orders/i)).toBeInTheDocument();
    expect(screen.getByText(/order history/i)).toBeInTheDocument();
  });

  it('hides empty-state block when orders exist', () => {
    useOrders.mockReturnValue({
      localOrders: [localOrder],
      dbOrders: [],
      dbLoading: false,
      loadDbOrders: jest.fn(),
    });
    renderPage();
    expect(screen.queryByText(/no orders yet/i)).not.toBeInTheDocument();
  });
});
