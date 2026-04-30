import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import logger from '../utils/logger';
import './MyOrdersPage.css';

const STATUS_ICONS = {
  'Order Received':  '📋',
  'Preparing':       '👨‍🍳',
  'Out for Delivery':'🚴',
  'Delivered':       '✅',
  'Cancelled':       '❌',
};

const STATUS_COLOR = {
  'Order Received':  '#f59e0b',
  'Preparing':       '#3b82f6',
  'Out for Delivery':'#8b5cf6',
  'Delivered':       '#10b981',
  'Cancelled':       '#ef4444',
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const OrderCard = ({ order, isLive = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`my-orders-card${isLive ? ' my-orders-card--live' : ''}${expanded ? ' my-orders-card--expanded' : ''}`}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header row */}
      <div className="my-orders-card__header">
        <div className="my-orders-card__left">
          {isLive && <span className="my-orders-card__live-dot" />}
          <div>
            <p className="my-orders-card__id">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="my-orders-card__date">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="my-orders-card__right">
          <span
            className="my-orders-card__status"
            style={{ color: STATUS_COLOR[order.status] }}
          >
            {STATUS_ICONS[order.status]} {order.status}
          </span>
          <span className="my-orders-card__amount">₹{order.totalAmount?.toFixed(0)}</span>
          <span className="my-orders-card__chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="my-orders-card__details">
          <div className="my-orders-card__info-row">
            <span className="my-orders-card__info-label">Customer</span>
            <span>{order.customerName}</span>
          </div>
          <div className="my-orders-card__info-row">
            <span className="my-orders-card__info-label">Phone</span>
            <span>{order.phone}</span>
          </div>
          <div className="my-orders-card__info-row">
            <span className="my-orders-card__info-label">Address</span>
            <span>
              {order.shippingAddress
                ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.zipCode}`
                : `${order.address}, ${order.city}, ${order.state} – ${order.zipCode}`}
            </span>
          </div>
          <div className="my-orders-card__info-row">
            <span className="my-orders-card__info-label">Payment</span>
            <span>{order.paymentMethod} · {order.paymentStatus}</span>
          </div>

          <div className="my-orders-card__items">
            {order.items.map((item, i) => (
              <div key={i} className="my-orders-card__item">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div className="my-orders-card__item my-orders-card__item--total">
              <span>Total</span>
              <span>₹{order.totalAmount?.toFixed(0)}</span>
            </div>
          </div>

          {isLive && (
            <Link
              to={`/orders/${order._id}`}
              className="my-orders-card__track-btn"
              onClick={(e) => e.stopPropagation()}
            >
              Track Order →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

const MyOrdersPage = () => {
  const { localOrders, dbOrders, dbLoading, loadDbOrders } = useOrders();

  useEffect(() => {
    logger.info('[MyOrdersPage] Loading DB orders');
    loadDbOrders();
  }, [loadDbOrders]);

  const hasAny = localOrders.length > 0 || dbOrders.length > 0;

  return (
    <div className="my-orders-page">
      <h1 className="my-orders-page__title">My Orders</h1>

      {/* ── Active (localStorage) orders ── */}
      {localOrders.length > 0 && (
        <section className="my-orders-page__section">
          <h2 className="my-orders-page__section-title">
            🔴 Active Orders <span className="my-orders-page__section-count">{localOrders.length}</span>
          </h2>
          <p className="my-orders-page__section-hint">These are tracked in real-time until delivered.</p>
          <div className="my-orders-page__list">
            {localOrders.map((order) => (
              <OrderCard key={order._id} order={order} isLive />
            ))}
          </div>
        </section>
      )}

      {/* ── Historical DB orders ── */}
      <section className="my-orders-page__section">
        <h2 className="my-orders-page__section-title">
          📦 Order History
          {dbOrders.length > 0 && <span className="my-orders-page__section-count">{dbOrders.length}</span>}
        </h2>

        {dbLoading ? (
          <div className="my-orders-page__loading">
            <div className="my-orders-page__spinner" />
            <span>Loading order history...</span>
          </div>
        ) : dbOrders.length > 0 ? (
          <div className="my-orders-page__list">
            {dbOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        ) : !hasAny ? (
          /* Empty state – no orders at all */
          <div className="my-orders-page__empty">
            <div className="my-orders-page__empty-icon">🍽️</div>
            <h3>No orders yet!</h3>
            <p>Looks like you haven't ordered anything yet. Let's fix that!</p>
            <Link to="/" className="my-orders-page__order-btn">Browse Menu →</Link>
          </div>
        ) : (
          <p className="my-orders-page__empty-sub">No previous orders found.</p>
        )}
      </section>
    </div>
  );
};

export default MyOrdersPage;
