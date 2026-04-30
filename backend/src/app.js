const express = require('express');
const cors = require('cors');

const menuRoutes = require('./routes/menuRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/menu', menuRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('[HTTP] Health check requested');
  res.json({ status: 'OK', message: 'Server is running' });
});


module.exports = app;
