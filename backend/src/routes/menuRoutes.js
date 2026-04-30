const express = require('express');
const router = express.Router();
const { getMenuItems,getMenuItemById } = require('../controllers/menuController');

// GET /api/v1/menu
router.get('/', getMenuItems);

// GET /api/v1/menu/:id
router.get('/:id', getMenuItemById);

module.exports = router;
