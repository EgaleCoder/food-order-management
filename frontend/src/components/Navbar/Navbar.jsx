import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: #1a1a2e;
  color: #fff;
`;

const Logo = styled(Link)`
  font-size: 1.4rem;
  font-weight: 700;
  color: #e94560;
  text-decoration: none;
`;

const Links = styled.div`display: flex; gap: 24px; align-items: center;`;

const NavLink = styled(Link)`
  color: #ccc;
  text-decoration: none;
  font-size: 0.95rem;
  &:hover { color: #fff; }
`;

const CartBadge = styled.span`
  background: #e94560;
  color: #fff;
  border-radius: 50%;
  padding: 2px 7px;
  font-size: 0.75rem;
  margin-left: 4px;
`;

const Navbar = () => {
  const { totalItems } = useCart();
  return (
    <Nav>
      <Logo to="/">🍔 FoodOrder</Logo>
      <Links>
        <NavLink to="/">Menu</NavLink>
        <NavLink to="/cart">
          Cart {totalItems > 0 && <CartBadge>{totalItems}</CartBadge>}
        </NavLink>
        <NavLink to="/orders">Orders</NavLink>
      </Links>
    </Nav>
  );
};

export default Navbar;
