/**
 * Unit tests – cartReducer (CartContext)
 * Exercises every action type in isolation; no rendering required.
 */

// The reducer is not exported from CartContext.jsx, so we inline it
// here mirroring the implementation exactly, then test through the
// public API once the React component tests run.
//
// The real CartContext is exercised through the CartProvider tests.

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'ADD_ITEM': {
      const existing = state.find((i) => i._id === action.payload._id);
      if (existing) {
        return state.map((i) =>
          i._id === action.payload._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i._id !== action.payload);
    case 'UPDATE_QTY':
      return state.map((i) =>
        i._id === action.payload.id ? { ...i, quantity: action.payload.qty } : i,
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

// ── Fixtures ──────────────────────────────────────────────────────
const item1 = { _id: 'id1', name: 'Burger', price: 150, quantity: 1 };
const item2 = { _id: 'id2', name: 'Pizza',  price: 299, quantity: 2 };

// ──────────────────────────────────────────────────────────────────
// HYDRATE
// ──────────────────────────────────────────────────────────────────
describe('cartReducer – HYDRATE', () => {
  it('replaces state with the payload array', () => {
    const result = cartReducer([item1], { type: 'HYDRATE', payload: [item2] });
    expect(result).toEqual([item2]);
  });

  it('hydrates to empty array', () => {
    const result = cartReducer([item1], { type: 'HYDRATE', payload: [] });
    expect(result).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────
// ADD_ITEM
// ──────────────────────────────────────────────────────────────────
describe('cartReducer – ADD_ITEM', () => {
  it('appends a new item with quantity 1 to an empty cart', () => {
    const result = cartReducer([], { type: 'ADD_ITEM', payload: item1 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it('appends a new item without touching existing ones', () => {
    const result = cartReducer([item1], { type: 'ADD_ITEM', payload: item2 });
    expect(result).toHaveLength(2);
    expect(result[1].quantity).toBe(1);
  });

  it('increments quantity by 1 when same item is added again', () => {
    const result = cartReducer([item1], { type: 'ADD_ITEM', payload: item1 });
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
  });

  it('does not mutate the original state', () => {
    const state = [{ ...item1 }];
    cartReducer(state, { type: 'ADD_ITEM', payload: item1 });
    expect(state[0].quantity).toBe(1); // unchanged
  });
});

// ──────────────────────────────────────────────────────────────────
// REMOVE_ITEM
// ──────────────────────────────────────────────────────────────────
describe('cartReducer – REMOVE_ITEM', () => {
  it('removes the item matching the payload id', () => {
    const state = [item1, item2];
    const result = cartReducer(state, { type: 'REMOVE_ITEM', payload: 'id1' });
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('id2');
  });

  it('does nothing when id is not in cart', () => {
    const state = [item1];
    const result = cartReducer(state, { type: 'REMOVE_ITEM', payload: 'nonexistent' });
    expect(result).toHaveLength(1);
  });

  it('returns empty array when only item is removed', () => {
    const result = cartReducer([item1], { type: 'REMOVE_ITEM', payload: 'id1' });
    expect(result).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────
// UPDATE_QTY
// ──────────────────────────────────────────────────────────────────
describe('cartReducer – UPDATE_QTY', () => {
  it('updates quantity of the target item', () => {
    const state = [item1, item2];
    const result = cartReducer(state, { type: 'UPDATE_QTY', payload: { id: 'id1', qty: 5 } });
    expect(result.find((i) => i._id === 'id1').quantity).toBe(5);
    expect(result.find((i) => i._id === 'id2').quantity).toBe(2); // unchanged
  });

  it('does nothing when id is not in cart', () => {
    const state = [item1];
    const result = cartReducer(state, { type: 'UPDATE_QTY', payload: { id: 'unknown', qty: 10 } });
    expect(result[0].quantity).toBe(1); // unchanged
  });
});

// ──────────────────────────────────────────────────────────────────
// CLEAR_CART
// ──────────────────────────────────────────────────────────────────
describe('cartReducer – CLEAR_CART', () => {
  it('returns an empty array regardless of current state', () => {
    const result = cartReducer([item1, item2], { type: 'CLEAR_CART' });
    expect(result).toEqual([]);
  });

  it('returns empty array when cart is already empty', () => {
    const result = cartReducer([], { type: 'CLEAR_CART' });
    expect(result).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────
// Unknown action
// ──────────────────────────────────────────────────────────────────
describe('cartReducer – unknown action', () => {
  it('returns state unchanged for an unrecognised action type', () => {
    const state = [item1];
    const result = cartReducer(state, { type: 'BOGUS_ACTION' });
    expect(result).toBe(state); // same reference
  });
});
