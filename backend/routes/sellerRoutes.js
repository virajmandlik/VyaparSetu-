const express = require('express');
const router = express.Router();
const {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
} = require('../controllers/sellerController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerSeller);
router.post('/login', loginSeller);

//product CRUD Routes to be made
// ....

// Protected routes
router.get('/profile', protect, getSellerProfile);
router.put('/profile', protect, updateSellerProfile);

module.exports = router; 