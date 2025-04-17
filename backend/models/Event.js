const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: Number,
  totalPrice: Number,
  purchaseDate: { type: Date, default: Date.now }
  //country, and type and name of and date of event 
});

module.exports = mongoose.model('Event', eventSchema); 