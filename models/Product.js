const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  price: {
    type: Number,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  image: {
    type: String,
  },
  rating: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId, // Assuming userid will be stored as ObjectId
    ref: "User", // Reference to the User model
    required: true,
  },
});

module.exports = mongoose.model("Product", productSchema);
