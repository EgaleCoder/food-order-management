require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

// Start the server after establishing database connection
const startServer = async () => {
  try {
    await connectDB();
    console.log('[Server] Database connection established successfully');
    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} | ENV: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', { message: error.message });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
startServer();
