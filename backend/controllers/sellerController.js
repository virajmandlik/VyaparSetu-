const Seller = require('../models/Seller');
const generateToken = require('../utils/generateToken');

// @desc    Register a new seller
// @route   POST /api/sellers/register
// @access  Public
const registerSeller = async (req, res) => {
  try {
    const { name, email, password, contactNumber, address } = req.body;

    // Check if seller exists
    const sellerExists = await Seller.findOne({ email });
    if (sellerExists) {
      return res.status(400).json({ message: 'Seller already exists' });
    }

    // Create seller
    const seller = await Seller.create({
      name,
      email,
      password,
      contactNumber,
      address,
    });

    if (seller) {
      res.status(201).json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        contactNumber: seller.contactNumber,
        address: seller.address,
        token: generateToken(seller._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login seller
// @route   POST /api/sellers/login
// @access  Public
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find seller by email
    const seller = await Seller.findOne({ email });

    // Check if seller exists and password matches
    if (seller && (await seller.matchPassword(password))) {
      res.json({
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        contactNumber: seller.contactNumber,
        address: seller.address,
        token: generateToken(seller._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller profile
// @route   GET /api/sellers/profile
// @access  Private
const getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user._id).select('-password');
    if (seller) {
      res.json(seller);
    } else {
      res.status(404).json({ message: 'Seller not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update seller profile
// @route   PUT /api/sellers/profile
// @access  Private
const updateSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user._id);

    if (seller) {
      seller.name = req.body.name || seller.name;
      seller.email = req.body.email || seller.email;
      seller.contactNumber = req.body.contactNumber || seller.contactNumber;
      seller.address = req.body.address || seller.address;

      if (req.body.password) {
        seller.password = req.body.password;
      }

      const updatedSeller = await seller.save();

      res.json({
        _id: updatedSeller._id,
        name: updatedSeller.name,
        email: updatedSeller.email,
        contactNumber: updatedSeller.contactNumber,
        address: updatedSeller.address,
        token: generateToken(updatedSeller._id),
      });
    } else {
      res.status(404).json({ message: 'Seller not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
}; 