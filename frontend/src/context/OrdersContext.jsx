/**
 * OrdersContext
 *
 * Deferred-persistence strategy:
 *  1. When an order is placed → saved to localStorage only (temp UUID as _id).
 *     Cart is cleared in DB at this point.
 *  2. Status simulation auto-advances (15s / step → ~60s total).
 *  3. When status reaches "Delivered" → POST /api/orders to persist to DB,
 *     then remove the local order from localStorage.
 *  4. My Orders page: active local orders (newest first) at top,
 *     historical DB orders below.
 */
import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { fetchAllOrders, placeOrder } from '../services/orderService';
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

  // ── Persist a completed order to DB ─────────────────────────
  const persistToDb = useCallback(async (order) => {
    logger.info(`[OrdersContext] Persisting order ${order._id} to DB as Delivered`);
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
        status:        'Delivered',
        // items have menuItem as the ObjectId string
        items: order.items.map((i) => ({
          menuItemId: i.menuItem?._id || i.menuItem,
          quantity:   i.quantity,
        })),
      };
      await placeOrder(payload);
      logger.info(`[OrdersContext] Order ${order._id} saved to DB successfully`);
    } catch (e) {
      logger.error(`[OrdersContext] Failed to persist order ${order._id} to DB:`, e);
      toast.error('⚠️ Could not sync your order to the server. Please contact support.');
    }
  }, []);

  // ── Status simulation for a single order ────────────────────
  const simulateStatus = useCallback((orderId, startStatus) => {
    const startIdx = STATUS_FLOW.indexOf(startStatus);
    if (startIdx === -1 || startIdx === STATUS_FLOW.length - 1) return;

    (timersRef.current[orderId] || []).forEach(clearTimeout);
    timersRef.current[orderId] = [];

    STATUS_FLOW.slice(startIdx + 1).forEach((nextStatus, i) => {
      const delay = STATUS_DELAY_MS * (i + 1);
      const tid = setTimeout(async () => {
        logger.info(`[OrdersContext] Order ${orderId} → ${nextStatus}`);

        let orderSnapshot = null;

        setLocalOrders((prev) => {
          const updated = prev.map((o) =>
            o._id === orderId ? { ...o, status: nextStatus } : o,
          );

          if (nextStatus === 'Delivered') {
            // Grab a snapshot for DB persistence before removing from LS
            orderSnapshot = updated.find((o) => o._id === orderId);
            logger.info(`[OrdersContext] Removing ${orderId} from LS after delivery`);
            return updated.filter((o) => o._id !== orderId);
          }
          return updated;
        });

        if (nextStatus === 'Delivered' && orderSnapshot) {
          await persistToDb(orderSnapshot);
        }
      }, delay);

      timersRef.current[orderId].push(tid);
    });
  }, [persistToDb]);

  // Re-attach simulators for orders that survived a page refresh
  useEffect(() => {
    localOrders.forEach((o) => {
      if (o.status !== 'Delivered' && o.status !== 'Cancelled') {
        simulateStatus(o._id, o.status);
      }
    });
    return () => Object.values(timersRef.current).flat().forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally once on mount

  // ── Add a new local order (called from CheckoutPage) ────────
  const addLocalOrder = useCallback((order) => {
    logger.info(`[OrdersContext] Adding local order: ${order._id}`);
    setLocalOrders((prev) => [order, ...prev]);
    simulateStatus(order._id, order.status || 'Order Received');
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
