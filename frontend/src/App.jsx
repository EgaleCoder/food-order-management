import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider }   from './context/CartContext';
import { MenuProvider }   from './context/MenuContext';
import GlobalStyles from './styles/GlobalStyles';
import Navbar        from './components/Navbar/Navbar';
import MenuPage      from './pages/MenuPage';
import CartPage      from './pages/CartPage';




function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <MenuProvider>

            <GlobalStyles />
            <Navbar />
            <Routes>
              <Route path="/"           element={<MenuPage />} />
              <Route path="/cart"       element={<CartPage />} />
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
  
        </MenuProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
