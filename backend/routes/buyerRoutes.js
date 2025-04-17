const express = require('express');
const router = express.Router();
const {
  registerBuyer,
  loginBuyer,
  getBuyerProfile,
  updateBuyerProfile,
} = require('../controllers/buyerController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerBuyer);
router.post('/login', loginBuyer);

// Protected routes
router.get('/profile', protect, getBuyerProfile);
router.put('/profile', protect, updateBuyerProfile);

module.exports = router; 