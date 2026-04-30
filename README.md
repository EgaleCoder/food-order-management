<div align="center">
  <h1>🍔 Food Order Management System</h1>
  <p>A full-stack, responsive food ordering application built with the MERN stack (MongoDB, Express, React, Node.js). Features include a dynamic menu, session-based cart management, robust checkout validation, and real-time order status simulation.</p>
</div>

---

## 🌟 Features

- **Dynamic Menu Navigation:** Browse available food items with prices and images.
- **Session-based Cart Management:** Add, update, and remove items from the cart seamlessly, synchronized with the backend.
- **Real-Time Order Tracking:** Simulates order lifecycle from *Order Received* ➔ *Preparing* ➔ *Out for Delivery* ➔ *Delivered*.
- **Robust Checkout & Validation:** Comprehensive field-level validation (Joi on backend, synced rules on frontend) for forms including Indian phone numbers and PIN codes.
- **Order History:** Distinct views for live (active) orders and historical (delivered/cancelled) orders.
- **Comprehensive Test Coverage:** 170+ unit and integration tests across both frontend and backend using Jest, Supertest, and React Testing Library.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **Styling:** Vanilla CSS & Styled Components
- **State Management:** React Context API (`CartContext`, `OrdersContext`, `MenuContext`)
- **HTTP Client:** Axios
- **Testing:** Jest, React Testing Library

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Validation:** Joi
- **Logging:** Winston
- **Testing:** Jest, Supertest

---

## 📂 Project Structure

```text
food-order-management/
├── backend/                  # Express/Node.js API
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # Route controllers (API logic)
│   │   ├── data/             # Seeding data
│   │   ├── middlewares/      # Error handling & Joi validation schemas
│   │   ├── models/           # Mongoose schemas (Cart, Order, MenuItem)
│   │   ├── routes/           # Express routes
│   │   ├── services/         # Business logic layer
│   │   └── utils/            # Winston logger setup
│   ├── tests/                # Unit & Integration Tests (Supertest)
│   └── package.json
│
└── frontend/                 # React/Vite UI
    ├── src/
    │   ├── api/              # Axios instance configuration
    │   ├── components/       # Reusable UI components (CartItem, MenuCard, Navbar)
    │   ├── context/          # Global application state 
    │   ├── pages/            # View components (Menu, Cart, Checkout, MyOrders)
    │   ├── services/         # API wrappers mapping to backend endpoints
    │   ├── utils/            # Helpers (Validation, Session, Formatters)
    │   └── __mocks__/        # Jest test setup files
    ├── tests/                # React unit & integration tests
    └── package.json
```

---

## 🔌 API Reference

### 🍕 Menu API
| Method | Endpoint               | Description                  |
|--------|------------------------|------------------------------|
| `GET`  | `/api/v1/menu`         | Get all available menu items |
| `GET`  | `/api/v1/menu/:id`     | Get a specific menu item     |

### 🛒 Cart API
| Method   | Endpoint                                   | Description                    |
|----------|--------------------------------------------|--------------------------------|
| `GET`    | `/api/v1/cart/:sessionId`                  | Retrieve cart for a session    |
| `POST`   | `/api/v1/cart/:sessionId/items`            | Add an item to the cart        |
| `PATCH`  | `/api/v1/cart/:sessionId/items/:menuItemId`| Update an item's quantity      |
| `DELETE` | `/api/v1/cart/:sessionId/items/:menuItemId`| Remove an item from the cart   |
| `DELETE` | `/api/v1/cart/:sessionId`                  | Clear the entire cart          |

### 📦 Orders API
| Method  | Endpoint                         | Description                          |
|---------|----------------------------------|--------------------------------------|
| `GET`   | `/api/v1/orders`                 | Get all orders                       |
| `GET`   | `/api/v1/orders/:id`             | Get a specific order by ID           |
| `POST`  | `/api/v1/orders`                 | Place a new order                    |
| `PATCH` | `/api/v1/orders/:id/status`      | Update order status (Admin function) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### 1. Database Setup
Ensure you have a MongoDB server running. Update the `.env` file in the backend directory.

### 2. Backend Installation
```bash
cd backend

# Install dependencies
npm install

# Create environment file
# Set your MONGO_URI and PORT in the .env file
echo "PORT=5000\nMONGO_URI=mongodb://localhost:27017/food-order" > .env

# Seed the database with initial menu items
npm run data:import

# Start the server (Dev Mode)
npm run dev
```
The API will be available at `http://localhost:5000`

### 3. Frontend Installation
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The React app will be available at `http://localhost:5173`

---

## 🧪 Testing

The project is fully covered by automated tests to ensure reliability and prevent regressions.

### Run Backend Tests
```bash
cd backend
npm test
```
*Coverage includes Mongoose models (mocked), Joi validation schemas, Cart & Order Services, Controllers, and REST API routes via Supertest.*

### Run Frontend Tests
```bash
cd frontend
npm test
```
*Coverage includes `checkoutValidation` utility, `cartReducer`, `CartContext` integrations, and component tests for `MyOrdersPage` & `CheckoutPage` using React Testing Library.*

---

## 📜 License
This project is licensed under the ISC License.

## 👨‍💻 Author
Built by [Abhinav Mishra]
