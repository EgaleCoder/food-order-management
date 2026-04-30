import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { toast } from 'react-toastify';
import { validateCheckoutForm, validateField } from '../utils/checkoutValidation';
import './CheckoutPage.css';
import logger from '../utils/logger';

const PAYMENT_METHODS = ['UPI', 'Net Banking', 'Cash on Delivery'];

const EMPTY_FORM = {
  customerName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  paymentMethod: '',
};

const CheckoutPage = () => {
  const { cart, totalAmount, clearCart } = useCart();
  const { addLocalOrder } = useOrders();
  const navigate = useNavigate();

  const [form, setForm]               = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched]         = useState({});
  const [submitting, setSubmitting]   = useState(false);

  // ── Real-time field validation ────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields so errors are visible
    const allTouched = Object.keys(EMPTY_FORM).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const { fieldErrors: errs, isValid } = validateCheckoutForm(form);
    setFieldErrors(errs);

    if (!isValid) {
      toast.error('Please fix the highlighted errors before continuing.');
      logger.warn('[CheckoutPage] Validation failed', errs);
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    logger.info('[CheckoutPage] Creating local order', { customerName: form.customerName });

    try {
      // Build a fully self-contained order object for localStorage
      const tempOrder = {
        _id:           crypto.randomUUID(),   // temp ID – replaced by DB _id on save
        customerName:  form.customerName.trim(),
        phone:         form.phone.trim(),
        address:       form.address.trim(),
        city:          form.city.trim(),
        state:         form.state.trim(),
        zipCode:       form.zipCode.trim(),
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        items: cart.map((item) => ({
          menuItem: item._id,      // matches orderModel's menuItem ref field
          name:     item.name,
          price:    item.price,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
        })),
        totalAmount,
        status:    'Order Received',
        createdAt: new Date().toISOString(),
        _isLocal:  true,           // marker for OrdersContext / OrderPage
      };

      // 1. Add to local orders (starts 60s simulation → persists to DB on Delivered)
      addLocalOrder(tempOrder);

      // 2. Clear cart in React state + DB
      clearCart();

      logger.info(`[CheckoutPage] Local order created: ${tempOrder._id}`);
      toast.success('🎉 Order placed! Tracking it live for you.');

      navigate(`/orders/${tempOrder._id}`);
    } catch (err) {
      logger.error('[CheckoutPage] Unexpected error creating local order', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Input helper ──────────────────────────────────────────────
  const inputProps = (name, placeholder, extra = {}) => ({
    name,
    placeholder,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    className: `checkout-page__input${fieldErrors[name] ? ' checkout-page__input--error' : ''}`,
    ...extra,
  });

  return (
    <div className="checkout-page">
      <h1 className="checkout-page__title">Checkout</h1>

      <div className="checkout-page__summary">
        <span>{cart.length} item(s) in cart</span>
        <span className="checkout-page__total">Total: ₹{totalAmount.toFixed(0)}</span>
      </div>

      <form className="checkout-page__form" onSubmit={handleSubmit} noValidate>

        {/* ── Delivery Details ── */}
        <div className="checkout-page__section-label">Delivery Details</div>

        <div className="checkout-page__row">
          <div className="checkout-page__field">
            <label>Full Name *</label>
            <input {...inputProps('customerName', 'John Doe')} />
            {fieldErrors.customerName && <span className="checkout-page__field-error">{fieldErrors.customerName}</span>}
          </div>
          <div className="checkout-page__field">
            <label>Phone Number *</label>
            <input {...inputProps('phone', '9876543210', { type: 'tel', maxLength: 10 })} />
            {fieldErrors.phone && <span className="checkout-page__field-error">{fieldErrors.phone}</span>}
          </div>
        </div>

        <div className="checkout-page__field">
          <label>Street Address *</label>
          <input {...inputProps('address', 'House No., Street, Area')} />
          {fieldErrors.address && <span className="checkout-page__field-error">{fieldErrors.address}</span>}
        </div>

        <div className="checkout-page__row">
          <div className="checkout-page__field">
            <label>City *</label>
            <input {...inputProps('city', 'Mumbai')} />
            {fieldErrors.city && <span className="checkout-page__field-error">{fieldErrors.city}</span>}
          </div>
          <div className="checkout-page__field">
            <label>State *</label>
            <input {...inputProps('state', 'Maharashtra')} />
            {fieldErrors.state && <span className="checkout-page__field-error">{fieldErrors.state}</span>}
          </div>
          <div className="checkout-page__field">
            <label>ZIP / PIN Code *</label>
            <input {...inputProps('zipCode', '400001', { maxLength: 6 })} />
            {fieldErrors.zipCode && <span className="checkout-page__field-error">{fieldErrors.zipCode}</span>}
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="checkout-page__section-label">Payment Method</div>
        {fieldErrors.paymentMethod && <span className="checkout-page__field-error">{fieldErrors.paymentMethod}</span>}

        <div className="checkout-page__payment-grid">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method}
              className={`checkout-page__payment-option${form.paymentMethod === method ? ' checkout-page__payment-option--active' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={form.paymentMethod === method}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {method}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="checkout-page__submit-btn"
          disabled={submitting || cart.length === 0}
        >
          {submitting ? 'Placing Order...' : `Place Order · ₹${totalAmount.toFixed(0)}`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
