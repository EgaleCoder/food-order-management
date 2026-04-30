/**
 * Integration tests – CartProvider (CartContext)
 * Verifies the full context value: initialisation, optimistic updates,
 * background DB sync calls, and computed values (totalAmount, totalItems).
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '../../src/context/CartContext';

// ── Mock cartService ──────────────────────────────────────────────
jest.mock('../../src/services/cartService', () => ({
  fetchCart: jest.fn(),
  apiAddItem: jest.fn(),
  apiUpdateItem: jest.fn(),
  apiRemoveItem: jest.fn(),
  apiClearCart: jest.fn(),
}));

const {
  fetchCart,
  apiAddItem,
  apiUpdateItem,
  apiRemoveItem,
  apiClearCart,
} = require('../../src/services/cartService');

// ── Test consumer component ───────────────────────────────────────
const TestConsumer = () => {
  const { cart, addItem, removeItem, updateQty, clearCart, totalAmount, totalItems } = useCart();
  const item = { _id: 'id1', name: 'Burger', price: 150 };

  return (
    <div>
      <p data-testid="count">{cart.length}</p>
      <p data-testid="total-amount">{totalAmount}</p>
      <p data-testid="total-items">{totalItems}</p>
      {cart.map((i) => (
        <p key={i._id} data-testid={`item-${i._id}`}>
          {i.name} × {i.quantity}
        </p>
      ))}
      <button onClick={() => addItem(item)}>Add</button>
      <button onClick={() => removeItem('id1')}>Remove</button>
      <button onClick={() => updateQty('id1', 5)}>UpdateQty</button>
      <button onClick={() => clearCart()}>Clear</button>
    </div>
  );
};

const renderCart = () =>
  render(
    <CartProvider>
      <TestConsumer />
    </CartProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  // Default: empty cart from DB
  fetchCart.mockResolvedValue({ items: [] });
  apiAddItem.mockResolvedValue({});
  apiUpdateItem.mockResolvedValue({});
  apiRemoveItem.mockResolvedValue({});
  apiClearCart.mockResolvedValue({});
});

// ──────────────────────────────────────────────────────────────────
// Initialisation
// ──────────────────────────────────────────────────────────────────
describe('CartProvider – initialisation', () => {
  it('starts with an empty cart when DB returns no items', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('hydrates cart from DB when items are returned', async () => {
    fetchCart.mockResolvedValue({
      items: [
        { menuItem: { _id: 'id1' }, name: 'Burger', price: 150, imageUrl: '', quantity: 2 },
      ],
    });

    renderCart();

    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('1'),
    );
    expect(screen.getByTestId('item-id1').textContent).toBe('Burger × 2');
  });
});

// ──────────────────────────────────────────────────────────────────
// addItem
// ──────────────────────────────────────────────────────────────────
describe('CartProvider – addItem', () => {
  it('adds a new item to the cart optimistically', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('item-id1').textContent).toBe('Burger × 1');
    expect(apiAddItem).toHaveBeenCalledTimes(1);
  });

  it('increments quantity when the same item is added twice', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
      await userEvent.click(screen.getByText('Add'));
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('item-id1').textContent).toBe('Burger × 2');
  });
});

// ──────────────────────────────────────────────────────────────────
// removeItem
// ──────────────────────────────────────────────────────────────────
describe('CartProvider – removeItem', () => {
  it('removes an item from the cart', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
    });
    expect(screen.getByTestId('count').textContent).toBe('1');

    await act(async () => {
      await userEvent.click(screen.getByText('Remove'));
    });
    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(apiRemoveItem).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────
// updateQty
// ──────────────────────────────────────────────────────────────────
describe('CartProvider – updateQty', () => {
  it('updates the quantity of an item', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
    });
    await act(async () => {
      await userEvent.click(screen.getByText('UpdateQty'));
    });

    expect(screen.getByTestId('item-id1').textContent).toBe('Burger × 5');
    expect(apiUpdateItem).toHaveBeenCalledWith('id1', 5);
  });
});

// ──────────────────────────────────────────────────────────────────
// clearCart
// ──────────────────────────────────────────────────────────────────
describe('CartProvider – clearCart', () => {
  it('empties the cart', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
    });
    await act(async () => {
      await userEvent.click(screen.getByText('Clear'));
    });

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(apiClearCart).toHaveBeenCalledTimes(1);
  });
});

// ──────────────────────────────────────────────────────────────────
// Derived values
// ──────────────────────────────────────────────────────────────────
describe('CartProvider – derived values', () => {
  it('computes totalAmount correctly', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    // Add same item twice → qty 2 × ₹150 = ₹300
    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
      await userEvent.click(screen.getByText('Add'));
    });

    expect(screen.getByTestId('total-amount').textContent).toBe('300');
  });

  it('computes totalItems correctly', async () => {
    renderCart();
    await waitFor(() => expect(fetchCart).toHaveBeenCalled());

    await act(async () => {
      await userEvent.click(screen.getByText('Add'));
      await userEvent.click(screen.getByText('Add'));
    });

    expect(screen.getByTestId('total-items').textContent).toBe('2');
  });
});

// ──────────────────────────────────────────────────────────────────
// Hook guard
// ──────────────────────────────────────────────────────────────────
describe('useCart – guard', () => {
  it('throws when used outside CartProvider', () => {
    // Suppress error output for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const BadComponent = () => {
      useCart();
      return null;
    };
    expect(() => render(<BadComponent />)).toThrow('useCart must be used inside CartProvider');
    spy.mockRestore();
  });
});
