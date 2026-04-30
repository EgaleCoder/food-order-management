import { useCart } from '../../context/CartContext';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateQty, removeItem } = useCart();

  const handleQtyDown = () => {
    if (item.quantity > 1) {
      //logger.debug(`[CartItem] Decreasing qty for: ${item.name}`);
      updateQty(item._id, item.quantity - 1);
    } else {
      //logger.info(`[CartItem] Removing item (qty → 0): ${item.name}`);
      removeItem(item._id);
    }
  };

  const handleQtyUp = () => {
    //logger.debug(`[CartItem] Increasing qty for: ${item.name}`);
    updateQty(item._id, item.quantity + 1);
  };

  const handleRemove = () => {
    //logger.info(`[CartItem] Removing item: ${item.name}`);
    removeItem(item._id);
  };

  return (
    <div className="cart-item">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="cart-item__img"
        onError={(e) => { e.target.src = 'https://via.placeholder.com/72x72?text=Food'; }}
      />
      <div className="cart-item__info">
        <p className="cart-item__name">{item.name}</p>
        <p className="cart-item__price">₹{(item.price * item.quantity).toFixed(0)}</p>
      </div>
      <div className="cart-item__controls">
        <button className="cart-item__qty-btn" onClick={handleQtyDown}>−</button>
        <span className="cart-item__qty">{item.quantity}</span>
        <button className="cart-item__qty-btn" onClick={handleQtyUp}>+</button>
        <button className="cart-item__remove" onClick={handleRemove}>Remove</button>
      </div>
    </div>
  );
};

export default CartItem;
