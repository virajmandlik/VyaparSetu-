const Buyer = require('../models/Buyer');
const generateToken = require('../utils/generateToken');

// @desc    Register a new buyer
// @route   POST /api/buyers/register
// @access  Public
const registerBuyer = async (req, res) => {
  try {
    const { name, email, password, contactNumber, address } = req.body;

    // Check if buyer exists
    const buyerExists = await Buyer.findOne({ email });
    if (buyerExists) {
      return res.status(400).json({ message: 'Buyer already exists' });
    }

    // Create buyer
    const buyer = await Buyer.create({
      name,
      email,
      password,
      contactNumber,
      address,
    });

    if (buyer) {
      res.status(201).json({
        _id: buyer._id,
        name: buyer.name,
        email: buyer.email,
        contactNumber: buyer.contactNumber,
        address: buyer.address,
        token: generateToken(buyer._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login buyer
// @route   POST /api/buyers/login
// @access  Public
const loginBuyer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find buyer by email
    const buyer = await Buyer.findOne({ email });

    // Check if buyer exists and password matches
    if (buyer && (await buyer.matchPassword(password))) {
      res.json({
        _id: buyer._id,
        name: buyer.name,
        email: buyer.email,
        contactNumber: buyer.contactNumber,
        address: buyer.address,
        token: generateToken(buyer._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get buyer profile
// @route   GET /api/buyers/profile
// @access  Private
const getBuyerProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user._id)
      .select('-password')
      .populate('purchaseHistory.product')
      .populate('recommendedProducts');
    
    if (buyer) {
      res.json(buyer);
    } else {
      res.status(404).json({ message: 'Buyer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update buyer profile
// @route   PUT /api/buyers/profile
// @access  Private
const updateBuyerProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.user._id);

    if (buyer) {
      buyer.name = req.body.name || buyer.name;
      buyer.email = req.body.email || buyer.email;
      buyer.contactNumber = req.body.contactNumber || buyer.contactNumber;
      buyer.address = req.body.address || buyer.address;

      if (req.body.password) {
        buyer.password = req.body.password;
      }

      const updatedBuyer = await buyer.save();

      res.json({
        _id: updatedBuyer._id,
        name: updatedBuyer.name,
        email: updatedBuyer.email,
        contactNumber: updatedBuyer.contactNumber,
        address: updatedBuyer.address,
        token: generateToken(updatedBuyer._id),
      });
    } else {
      res.status(404).json({ message: 'Buyer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerBuyer,
  loginBuyer,
  getBuyerProfile,
  updateBuyerProfile,
}; 