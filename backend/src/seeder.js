const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const MenuItem = require('./models/menuItemModel');
const foodItems = require('./data/foodItems.json');

// Load environment variables
dotenv.config();

// Connect to the database
connectDB();

const importData = async () => {
  try {
    // Clear existing menu items to prevent duplicates
    await MenuItem.deleteMany();

    // Insert new seed data
    await MenuItem.insertMany(foodItems);

    logger.info('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    logger.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    // Clear existing menu items
    await MenuItem.deleteMany();

    logger.info('Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    logger.error(`Error with data destruction: ${error.message}`);
    process.exit(1);
  }
};

// Check for the -d flag to determine if we are destroying or importing data
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
