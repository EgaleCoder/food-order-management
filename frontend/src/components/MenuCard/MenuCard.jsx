import { useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import './MenuCard.css';

const seededRating = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = Math.imul(31, h) + name.charCodeAt(i) | 0;
  const rand = Math.abs(h) / 2147483647;
  return (1 + rand * 4).toFixed(1);
};

const seededReviews = (name) => {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = Math.imul(33, h) ^ name.charCodeAt(i);
  return 50 + (Math.abs(h) % 451); // 50 – 500
};

const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars">
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  );
};

const MenuCard = ({ item }) => {
  const { addItem } = useCart();
  const [showModal, setShowModal] = useState(false);

  // Stable per-item rating derived from name (no dummy table needed)
  const rating = useMemo(() => parseFloat(seededRating(item.name)), [item.name]);
  const reviews = useMemo(() => seededReviews(item.name), [item.name]);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(item);
    toast.success(`${item.name} added to cart! 🛒`);
  };

  const handleModalAddToCart = () => {
    addItem(item);
    toast.success(`${item.name} added to cart! 🛒`);
    setShowModal(false);
  };

  return (
    <>
      {/* ── Card ────────────────────────────────────────── */}
      <div className="menu-card" onClick={() => { setShowModal(true); }}>
        <div className="menu-card__img-wrapper">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="menu-card__img"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x220?text=Food'; }}
          />
        </div>

        <div className="menu-card__body">
          <h3 className="menu-card__name">{item.name}</h3>
          <p className="menu-card__desc">{item.description}</p>

          <div className="menu-card__rating">
            <StarRating rating={rating} />
            <span className="menu-card__rating-num">{rating.toFixed(1)}</span>
            <span className="menu-card__reviews">({reviews} reviews)</span>
          </div>

          <div className="menu-card__footer">
            <span className="menu-card__price">₹{item.price.toFixed(0)}</span>
            <button className="menu-card__btn" onClick={handleAddToCart}>
              + Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setShowModal(false)}>✕</button>

            <img
              src={item.imageUrl}
              alt={item.name}
              className="modal__img"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/600x300?text=Food'; }}
            />

            <div className="modal__body">
              <h2 className="modal__name">{item.name}</h2>
              <p className="modal__desc">{item.description}</p>

              <div className="modal__rating">
                <StarRating rating={rating} />
                <span className="modal__rating-num">{rating.toFixed(1)}</span>
                <span className="modal__reviews">{reviews} customer reviews</span>
              </div>

              <div className="modal__details">
                <div className="modal__detail-item">
                  <span className="modal__detail-label">⏱ Prep Time</span>
                  <span className="modal__detail-value">20–30 min</span>
                </div>
                <div className="modal__detail-item">
                  <span className="modal__detail-label">🔥 Calories</span>
                  <span className="modal__detail-value">~{Math.floor(item.price * 1.8)} kcal</span>
                </div>
                <div className="modal__detail-item">
                  <span className="modal__detail-label">🚚 Delivery</span>
                  <span className="modal__detail-value">Free above ₹499</span>
                </div>
                <div className="modal__detail-item">
                  <span className="modal__detail-label">📦 Serves</span>
                  <span className="modal__detail-value">1 person</span>
                </div>
              </div>

              <div className="modal__footer">
                <span className="modal__price">₹{item.price.toFixed(0)}</span>
                <button className="modal__add-btn" onClick={handleModalAddToCart}>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;
