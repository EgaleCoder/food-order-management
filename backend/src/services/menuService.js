// services/menuService.js
const MenuItem = require('../models/menuItemModel');

// Get all available menu items
const getAllItems = () => MenuItem.find({ isAvailable: true });

// Get a specific menu item by ID
const getItemById = (id) => MenuItem.findById(id);

// exports
module.exports = { getAllItems, getItemById };