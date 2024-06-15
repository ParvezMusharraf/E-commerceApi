const express = require("express");
const ConnectDb = require("./connectdb");
const URl = "mongodb://0.0.0.0:27017/Testing";
const ProductJson = require("./product.json");
const app = express();
const PORT = 3000;
const ProductModel = require("./models/Product");
const UserModel = require("./models/userModel");
var cors = require("cors");
app.use(express.json());

app.use(cors());

// ALL PRODUCT API REQ
app.get("/Allproducts", async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await ProductModel.find({});
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ALL PRODUCT BY CATEGORY
app.get("/AllproductsByCategory", async (req, res) => {
  try {
    const { category } = req.query;
    // Fetch all products from the database
    const products = await ProductModel.find({ category });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ALL CATEGORY LIST
app.get("/getAllCatagoryList", async (req, res) => {
  try {
    // Fetch distinct categories from the database
    const categories = await ProductModel.aggregate([
      { $group: { _id: "$category", image: { $first: "$image" } } },
      { $project: { categoryName: "$_id", category: 1, image: 1, _id: 0 } }, // Rename _id to categoryId
    ]);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/SaveProduct", async (req, res) => {
  try {
    // Extract product details from the request body
    const { title, price, description, category, image, rating } = req.body;

    // Validate incoming data (you can use a validation library like Joi or validate manually)
    if (!title || !price || !category) {
      return res
        .status(400)
        .json({ error: "Title, price, and category are required" });
    }

    // Create a new product instance
    const newProduct = new ProductModel({
      title,
      price,
      description,
      category,
      image,
      rating,
    });

    // // payLoad
    // {
    //     "title": "Sample Product",
    //     "price": 29.99,
    //     "description": "This is a sample product description.",
    //     "category": "men's clothing",
    //     "image": "https://example.com/sample-image.jpg",
    //     "rating": {
    //         "rate": "4.5",
    //         "count": 10
    //     }
    // }

    // Save the new product to the database
    await newProduct.save();

    // Return success response
    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/Auth/User", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(201).json({ messege: "Some Feilds Are Missing" });
    }

    const user = new UserModel({
      username,
      email,
      password,
    });
    await user.save();
    res.status(201).json({ message: "User data saved successfully", user });
  } catch (error) {
    console.error("Error saving user", error);
    res.status(500).json({ error: "Error saving user" });
  }
});

app.post("/Auth/Login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if email or password is missing
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await UserModel.findOne({ email });
  
      // Check if user exists
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      // Compare passwords securely
      const isMatch = await (password == user.password)
      
      // Check if passwords match
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
  
      // Passwords match, login successful
      res.status(200).json({
        message: "Login successful",
        userAvailable:true,
        user,
      });
  
    } catch (error) {
      console.error("Error Finding User", error);
      res.status(500).json({ error: "Server error" });
    }
  });

app.listen(PORT, () => {
  console.log(`Server Started at ${PORT}`);
  ConnectDb(URl);
});
