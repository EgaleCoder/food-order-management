import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem/CartItem';

const Wrapper = styled.div`max-width: 640px; margin: 40px auto; padding: 0 24px;`;
const Title = styled.h1`color: #1a1a2e; margin-bottom: 24px;`;
const Total = styled.div`
  display: flex; justify-content: space-between;
  font-size: 1.2rem; font-weight: 700;
  padding: 16px 0; border-top: 2px solid #1a1a2e; margin-top: 16px;
`;
const CheckoutBtn = styled.button`
  width: 100%; padding: 14px;
  background: #e94560; color: #fff;
  border: none; border-radius: 10px;
  font-size: 1rem; font-weight: 700;
  cursor: pointer; margin-top: 16px;
  &:hover { background: #c73652; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;
const Empty = styled.p`text-align: center; color: #888; padding: 40px 0;`;

const CartPage = () => {
  const { cart, totalAmount } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) return <Wrapper><Empty>Your cart is empty.</Empty></Wrapper>;

  return (
    <Wrapper>
      <Title>Your Cart</Title>
      {cart.map((item) => <CartItem key={item._id} item={item} />)}
      <Total><span>Total</span><span>₹{totalAmount.toFixed(0)}</span></Total>
      <CheckoutBtn onClick={() => navigate('/checkout')}>Proceed to Checkout</CheckoutBtn>
    </Wrapper>
  );
};

export default CartPage;
