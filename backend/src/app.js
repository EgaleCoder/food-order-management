const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import routes
const menuRoutes = require('./routes/menuRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Create Express app
const app = express();

// Middleware
// Enable CORS for all routes
app.use(cors());
// Parse JSON and URL-encoded data
app.use(express.json());
// Parse URL-encoded data with extended option
app.use(express.urlencoded({ extended: true }));

// HTTP request logger middleware
app.use((req, _res, next) => {
  logger.info(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  logger.info('[HTTP] Health check requested');
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
