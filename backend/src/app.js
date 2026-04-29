const express = require('express');
const cors = require('cors');


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Health check
app.get('/api/v1/health', (req, res) => {
  console.log('[HTTP] Health check requested');
  res.json({ status: 'OK', message: 'Server is running' });
});


module.exports = app;
