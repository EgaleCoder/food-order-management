import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchOrderById } from '../services/orderService';
import { useOrders } from '../context/OrdersContext';
import logger from '../utils/logger';
import './OrderPage.css';

const STATUS_FLOW = ['Order Received', 'Preparing', 'Out for Delivery', 'Delivered'];
const STATUS_ICONS = {
  'Order Received':  '📋',
  'Preparing':       '👨‍🍳',
  'Out for Delivery':'🚴',
  'Delivered':       '✅',
  'Cancelled':       '❌',
};

const OrderPage = () => {
  const { id } = useParams();
  const { getLocalOrderById } = useOrders();
  const [order, setOrder]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState(null);
  const prevStatusRef             = useRef(null);

  // ── Step 1: Try localStorage first, then fall back to API ──
  useEffect(() => {
    const localOrder = getLocalOrderById(id);
    if (localOrder) {
      logger.info(`[OrderPage] Loaded order ${id} from localStorage`);
      setOrder(localOrder);
      setStatus(localOrder.status);
      setLoading(false);
      return;
    }

    // Only query DB for valid MongoDB ObjectIds (24-char hex)
    const isMongoId = /^[a-fA-F0-9]{24}$/.test(id);
    if (!isMongoId) {
      logger.warn(`[OrderPage] ID ${id} is not a MongoDB ObjectId and not in localStorage`);
      setLoading(false);
      return;
    }

    logger.info(`[OrderPage] Fetching order ${id} from API`);
    fetchOrderById(id)
      .then((data) => {
        logger.info('[OrderPage] Order fetched from API');
        setOrder(data);
        setStatus(data.status);
      })
      .catch((err) => logger.error('[OrderPage] Failed to fetch order', err))
      .finally(() => setLoading(false));
  }, [id, getLocalOrderById]);

  // ── Step 2: Mirror live status changes from context ──────────
  // Re-read the local order every second while it's still local
  useEffect(() => {
    const localOrder = getLocalOrderById(id);
    if (!localOrder) return; // already delivered / DB order

    const interval = setInterval(() => {
      const fresh = getLocalOrderById(id);
      if (!fresh) {
        clearInterval(interval);
        return;
      }
      if (fresh.status !== prevStatusRef.current) {
        logger.info(`[OrderPage] Live status update: ${fresh.status}`);
        setStatus(fresh.status);
        toast.info(`${STATUS_ICONS[fresh.status]} Order status: ${fresh.status}`);
        prevStatusRef.current = fresh.status;
      }
    }, 2000); // poll every 2s

    return () => clearInterval(interval);
  }, [id, getLocalOrderById]);

  if (loading) return (
    <div className="order-page order-page--centered">
      <div className="order-page__spinner" />
      <p>Loading your order...</p>
    </div>
  );

  if (!order) return (
    <div className="order-page order-page--empty">
      <div className="order-page__empty-icon">🍽️</div>
      <h2>No Order Found</h2>
      <p>We couldn't find this order. It may have been removed or the link is incorrect.</p>
      <Link to="/" className="order-page__back-btn">← Back to Menu</Link>
    </div>
  );

  const currentStatusIdx = STATUS_FLOW.indexOf(status);

  return (
    <div className="order-page">
      <div className="order-page__header">
        <h1 className="order-page__title">Order Confirmed! 🎉</h1>
        <span className={`order-page__badge order-page__badge--${status?.toLowerCase().replace(/\s+/g, '-')}`}>
          {STATUS_ICONS[status]} {status}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="order-page__timeline">
        {STATUS_FLOW.map((s, idx) => (
          <div
            key={s}
            className={`order-page__step${idx <= currentStatusIdx ? ' order-page__step--done' : ''}${idx === currentStatusIdx ? ' order-page__step--active' : ''}`}
          >
            <div className="order-page__step-icon">{STATUS_ICONS[s]}</div>
            <div className="order-page__step-label">{s}</div>
            {idx < STATUS_FLOW.length - 1 && (
              <div className={`order-page__step-line${idx < currentStatusIdx ? ' order-page__step-line--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Delivery Info */}
      <div className="order-page__card">
        <h3 className="order-page__section-title">Delivery Info</h3>
        <div className="order-page__info-grid">
          <div><span className="order-page__info-label">Name</span><span>{order.customerName}</span></div>
          <div><span className="order-page__info-label">Phone</span><span>{order.phone}</span></div>
          <div><span className="order-page__info-label">Address</span><span>
            {order.shippingAddress
              ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.zipCode}`
              : `${order.address}, ${order.city}, ${order.state} – ${order.zipCode}`}
          </span></div>
          <div><span className="order-page__info-label">Payment</span><span>{order.paymentMethod} ({order.paymentStatus})</span></div>
        </div>
      </div>

      {/* Items */}
      <div className="order-page__card">
        <h3 className="order-page__section-title">Items Ordered</h3>
        {order.items.map((item, i) => (
          <div key={i} className="order-page__item">
            <span className="order-page__item-name">{item.name} × {item.quantity}</span>
            <span className="order-page__item-price">₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div className="order-page__item order-page__item--total">
          <span>Total</span>
          <span>₹{order.totalAmount.toFixed(0)}</span>
        </div>
      </div>

      <Link to="/orders" className="order-page__back-btn">← My Orders</Link>
    </div>
  );
};

export default OrderPage;
