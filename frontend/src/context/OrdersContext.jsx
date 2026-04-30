/**
 * OrdersContext
 *
 * Immediate-persistence strategy:
 *  1. When an order is placed → POST /api/orders immediately (status: 'Order Received').
 *     The real DB _id is stored in localStorage alongside order data.
 *     Cart is cleared in DB at this point (via cartSessionId).
 *  2. Status simulation auto-advances (15s / step → ~60s total).
 *  3. Each status step → PATCH /api/orders/:id/status to keep DB in sync.
 *  4. On "Delivered", the local order is removed from localStorage.
 *  5. My Orders page: active local orders (newest first) at top,
 *     historical DB orders below.
 */
import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { fetchAllOrders, placeOrder, updateOrderStatus } from '../services/orderService';
import { getSessionId } from '../utils/session';
import { toast } from 'react-toastify';
import logger from '../utils/logger';

const STATUS_FLOW = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];
const STATUS_DELAY_MS = 15_000; // 15s per step → ~60s to Delivered

const LS_KEY = 'local_orders';

// Helpers to read/write orders from/to localStorage
const readLocalOrders = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
};
const writeLocalOrders = (orders) => localStorage.setItem(LS_KEY, JSON.stringify(orders));

const OrdersContext = createContext(null);

// ── Provider Component ─────────────────────────────────────────
export const OrdersProvider = ({ children }) => {
  const [localOrders, setLocalOrders] = useState(readLocalOrders);
  const [dbOrders, setDbOrders]       = useState([]);
  const [dbLoading, setDbLoading]     = useState(false);
  const timersRef = useRef({}); // { orderId: [timeoutId, ...] }

  // Persist to LS on every change
  useEffect(() => {
    writeLocalOrders(localOrders);
    logger.debug(`[OrdersContext] LS updated – ${localOrders.length} active orders`);
  }, [localOrders]);

  // ── Patch order status in DB ─────────────────────────────────
  const patchStatusInDb = useCallback(async (dbId, status) => {
    if (!dbId) return;
    logger.info(`[OrdersContext] PATCH order ${dbId} → ${status}`);
    try {
      await updateOrderStatus(dbId, status);
    } catch (e) {
      logger.error(`[OrdersContext] Failed to patch order ${dbId} status to ${status}:`, e);
    }
  }, []);

  // ── Status simulation for a single order ────────────────────
  // orderId = localStorage key (_id), dbId = real MongoDB _id for PATCH calls
  const simulateStatus = useCallback((orderId, dbId, startStatus) => {
    const startIdx = STATUS_FLOW.indexOf(startStatus);
    if (startIdx === -1 || startIdx === STATUS_FLOW.length - 1) return;

    (timersRef.current[orderId] || []).forEach(clearTimeout);
    timersRef.current[orderId] = [];

    STATUS_FLOW.slice(startIdx + 1).forEach((nextStatus, i) => {
      const delay = STATUS_DELAY_MS * (i + 1);
      const tid = setTimeout(async () => {
        logger.info(`[OrdersContext] Order ${orderId} → ${nextStatus}`);

        // Patch status in DB using real MongoDB _id
        await patchStatusInDb(dbId, nextStatus);

        setLocalOrders((prev) => {
          const updated = prev.map((o) =>
            o._id === orderId ? { ...o, status: nextStatus } : o,
          );
          if (nextStatus === 'Delivered') {
            logger.info(`[OrdersContext] Removing ${orderId} from LS after delivery`);
            return updated.filter((o) => o._id !== orderId);
          }
          return updated;
        });
      }, delay);

      timersRef.current[orderId].push(tid);
    });
  }, [patchStatusInDb]);

  // Re-attach simulators for orders that survived a page refresh
  useEffect(() => {
    localOrders.forEach((o) => {
      if (o.status !== 'Delivered' && o.status !== 'Cancelled') {
        simulateStatus(o._id, o.dbId, o.status);
      }
    });
    return () => Object.values(timersRef.current).flat().forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally once on mount

  // ── Add a new local order: POST to DB immediately, then simulate ──
  const addLocalOrder = useCallback(async (order, cartSessionId) => {
    logger.info(`[OrdersContext] Placing order for ${order.customerName} – saving to DB now`);
    let dbId = null;
    try {
      const payload = {
        customerName:  order.customerName,
        phone:         order.phone,
        address:       order.address,
        city:          order.city,
        state:         order.state,
        zipCode:       order.zipCode,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status:        'Order Received',
        cartSessionId,
        items: order.items.map((i) => ({
          menuItemId: i.menuItem?._id || i.menuItem,
          quantity:   i.quantity,
        })),
      };
      const saved = await placeOrder(payload);
      dbId = saved._id;
      logger.info(`[OrdersContext] Order saved to DB: ${dbId}`);
    } catch (e) {
      logger.error('[OrdersContext] Failed to save order to DB:', e);
      toast.error('⚠️ Could not save your order. Please try again.');
      throw e; // re-throw so CheckoutPage can handle it
    }

    const localOrder = { ...order, dbId };
    setLocalOrders((prev) => [localOrder, ...prev]);
    simulateStatus(order._id, dbId, order.status || 'Order Received');
    return dbId;
  }, [simulateStatus]);

  // ── Retrieve a local order by ID ─────────────────────────────
  const getLocalOrderById = useCallback((id) =>
    localOrders.find((o) => o._id === id) || null,
  [localOrders]);

  // ── Load historical DB orders (My Orders page) ───────────────
  const loadDbOrders = useCallback(async () => {
    logger.info('[OrdersContext] Fetching DB orders');
    setDbLoading(true);
    try {
      const data = await fetchAllOrders();
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      const localIds = new Set(localOrders.map((o) => o._id));
      setDbOrders(sorted.filter((o) => !localIds.has(o._id)));
      logger.info(`[OrdersContext] Loaded ${sorted.length} DB orders`);
    } catch (e) {
      logger.error('[OrdersContext] Failed to load DB orders', e);
    } finally {
      setDbLoading(false);
    }
  }, [localOrders]);

  return (
    <OrdersContext.Provider value={{
      localOrders,
      dbOrders,
      dbLoading,
      addLocalOrder,
      getLocalOrderById,
      loadDbOrders,
    }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider');
  return ctx;
};
