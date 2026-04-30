import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  fetchCart,
  apiAddItem,
  apiUpdateItem,
  apiRemoveItem,
  apiClearCart,
} from '../services/cartService';

const CartContext = createContext(null);

// ── Reducer (React state – always instant) ───────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;                            // load from DB on mount
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

// ── Provider ─────────────────────────────────────────────────────
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);

  // Hydrate from DB on mount
  useEffect(() => {
    // logger.info('[CartContext] Hydrating cart from DB');
    fetchCart()
      .then((dbCart) => {
        if (dbCart?.items?.length) {
          // Map DB cart items (using menuItem ObjectId as _id) into local shape
          const items = dbCart.items.map((i) => ({
            _id: i.menuItem?._id || i.menuItem,
            name: i.name,
            price: i.price,
            imageUrl: i.imageUrl,
            quantity: i.quantity,
          }));
          dispatch({ type: 'HYDRATE', payload: items });
          // logger.info(`[CartContext] Hydrated ${items.length} items from DB`);
        }
      })
      .catch((e) => console.error('[CartContext] Failed to hydrate cart from DB:', e.message)
      );
  }, []);

  // ── Actions (update React state instantly; sync to DB in background) ──
  const addItem = useCallback((item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    apiAddItem(item).catch((e) =>
      console.error('[CartContext] DB sync – addItem failed:', e.message),
    );
  }, []);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    apiRemoveItem(id).catch((e) =>
      console.warn('[CartContext] DB sync – removeItem failed:', e.message),
    );
  }, []);

  const updateQty = useCallback((id, qty) => {
    dispatch({ type: 'UPDATE_QTY', payload: { id, qty } });
    apiUpdateItem(id, qty).catch((e) =>
      console.warn('[CartContext] DB sync – updateItem failed:', e.message),
    );
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    apiClearCart().catch((e) =>
      console.warn('[CartContext] DB sync – clearCart failed:', e.message),
    );
  }, []);

  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addItem, removeItem, updateQty, clearCart,
      totalAmount, totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
