require('dotenv').config();
const app = require('./app');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT} | ENV: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', { message: error.message });
    process.exit(1);
  }
};

startServer();
