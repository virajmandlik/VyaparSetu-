const express = require('express');
const router = express.Router();
const {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
  uploadProductCSV,
  createProduct,
  updateInventory,
  getSellerProducts,
  deleteProduct,
} = require('../controllers/sellerController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerSeller);
router.post('/login', loginSeller);

//product CRUD Routes to be made
// ....
router.post('/products', protect, createProduct);
router.get('/products', protect, getSellerProducts);
router.post('/products/upload', protect, uploadProductCSV);
router.post('/products/:id', protect, updateProduct);
router.delete('/products/:id', protect, deleteProduct);
router.patch('/products/:id/inventory', protect, updateInventory);


// Protected routes
router.get('/profile', protect, getSellerProfile);
router.put('/profile', protect, updateSellerProfile);

module.exports = router; 