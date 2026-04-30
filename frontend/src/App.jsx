import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider }   from './context/CartContext';
import { MenuProvider }   from './context/MenuContext';
import { OrdersProvider } from './context/OrdersContext';
import GlobalStyles from './styles/GlobalStyles';
import Navbar        from './components/Navbar/Navbar';
import MenuPage      from './pages/MenuPage';
import CartPage      from './pages/CartPage';
import CheckoutPage  from './pages/CheckoutPage';
import OrderPage     from './pages/OrderPage';
import MyOrdersPage  from './pages/MyOrdersPage';
import logger from './utils/logger';

logger.info('[App] Application initialised');

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <MenuProvider>
          <OrdersProvider>
            <GlobalStyles />
            <Navbar />
            <Routes>
              <Route path="/"           element={<MenuPage />} />
              <Route path="/cart"       element={<CartPage />} />
              <Route path="/checkout"   element={<CheckoutPage />} />
              <Route path="/orders"     element={<MyOrdersPage />} />
              <Route path="/orders/:id" element={<OrderPage />} />
            </Routes>
            <ToastContainer
              position="bottom-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </OrdersProvider>
        </MenuProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
