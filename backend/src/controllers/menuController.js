// controllers/menuController.js
const menuService = require('../services/menuService');

// GET /api/v1/menu
const getMenuItems = async (req, res, next) => {
  try {
    const items = await menuService.getAllItems();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('[menuController] getMenuItems error:', error);
    next(error);
  }
};

// GET /api/v1/menu/:id
  const getMenuItemById = async (req, res, next) => {
  try {
    const item = await menuService.getItemById(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('[menuController] getMenuItemById error:', error);
    next(error);
  }
};


module.exports = { getMenuItems, getMenuItemById };
  