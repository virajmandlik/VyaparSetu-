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


/**CSV FILE Uploading  */

// @desc    Upload products via CSV
// @route   POST /api/seller/products/upload
// @access  Private (Seller)
const uploadProductCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No CSV file uploaded');
  }

  const products = [];
  const filePath = path.resolve(req.file.path);
  const allowedFields = ['name', 'description', 'price', 'quantity', 'category', 'imageUrl']; // Whitelist

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Validate required fields
            if (!row.name || !row.price || !row.quantity) {
              throw new Error('Missing required fields in CSV: name, price, or quantity');
            }

            // Sanitize and transform data
            const product = {
              name: String(row.name).trim(),
              description: row.description ? String(row.description).trim() : '',
              price: parseFloat(row.price),
              quantity: parseInt(row.quantity),
              category: row.category ? String(row.category).trim() : 'uncategorized',
              imageUrl: row.imageUrl || '',
              seller: req.user._id,
              createdAt: new Date() // Track upload time
            };

            // Validate price/quantity
            if (isNaN(product.price) || product.price <= 0) {
              throw new Error(`Invalid price for product: ${row.name}`);
            }
            if (isNaN(product.quantity) || product.quantity < 0) {
              throw new Error(`Invalid quantity for product: ${row.name}`);
            }

            products.push(product);
          } catch (error) {
            reject(error);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate at least one product was parsed
    if (products.length === 0) {
      throw new Error('CSV file contained no valid products');
    }

    // Insert in batches (avoids overwhelming MongoDB)
    const BATCH_SIZE = 100;
    const insertedProducts = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const result = await Product.insertMany(batch, { ordered: false }); // Continue on errors
      insertedProducts.push(...result);
    }

    // Cleanup file (async to avoid blocking response)
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete CSV:', err);
    });

    res.status(201).json({
      success: true,
      message: `${insertedProducts.length}/${products.length} products uploaded`,
      failed: products.length - insertedProducts.length,
      data: insertedProducts.slice(0, 10) // Return first 10 for preview
    });

  } catch (error) {
    // Cleanup file on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(400).json({
      success: false,
      message: error.message || 'CSV processing failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});







// @desc    Add a new product
// @route   POST /api/seller/products
// @access  Private (Seller)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price,stockQuantity, category, imageUrl } = req.body;

  if (!name || !description || !price || !stockQuantity || !category) {
    res.status(400).json({ message: 'Please include all required fields'});
  }

  const product = new Product({
    name,
    description,
    price,
    stockQuantity,
    category,
    imageUrl : imageUrl || '',
    seller: req.user._id,
  });

  const created = await product.save();
  res.status(201).json(created);
});



// @desc    Update inventory quantity
// @route   PATCH /api/seller/products/:id/inventory
// @access  Private (Seller)
const updateInventory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const product = await Product.findOne({ _id: id, seller: req.user._id });
  if (!product) {
    res.status(404).json({ message: 'Product not found or not owned by seller' });
    throw new Error('Product not found');
  }

  product.quantity = quantity;
  const updated = await product.save();
  res.status(200).json(updated);
});




// @desc    Get all products for a seller
// @route   GET /api/seller/products
// @access  Private (Seller)
const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id });
  res.json(products);
});




// @desc    Delete a product
// @route   DELETE /api/seller/products/:id
// @access  Private (Seller)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid product ID' });
  
  }


  const product = await Product.findOne({ _id: id, seller: req.user._id });

  if (!product) {
    res.status(404).json({ message: 'Product not found or not owned by seller' });
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product successfully deleted',
    deletedProductId: id // Useful for client-side reference
  });

});










module.exports = {
  registerSeller,
  loginSeller,
  getSellerProfile,
  updateSellerProfile,
  uploadProductCSV,
  createProduct,
  updateInventory,
  getSellerProducts,
  deleteProduct,
}; 