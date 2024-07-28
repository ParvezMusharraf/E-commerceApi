const express = require("express");
const ConnectDb = require("./connectdb");
const URl = "mongodb://0.0.0.0:27017/Testing";
// const URl = "mongodb+srv://parvezmusharraf61:parvez3344@cluster0.5b50qms.mongodb.net/cluster0?retryWrites=true&w=majority&appName=Cluster0";
const ProductJson = require("./product.json");
const app = express();
const PORT = 3000;
const ProductModel = require("./models/Product");
const UserModel = require("./models/userModel");
var cors = require("cors");
const userModel = require("./models/userModel");
const ProductCart = require("./models/cart");
const jwt = require("jsonwebtoken");
app.use(express.json());

app.use(cors());

const SECRET_KEY = "I am really a good boy"; // You should store this in an environment variable for better security

// ALL PRODUCT API REQ
app.get("/Allproducts", async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await ProductModel.find({});
    if (products.length > 0) {
      res.json(products);
    } else res.json("No Product Found");
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/allProductListByUserId", async (req, res) => {
  try {
    const { userid } = req.body;
    const products = await ProductModel.find({ userid });

    if (products.length > 0) {
      res.status(200).json(products);
    } else {
      res.status(200).json({
        msg: "No products found for the user",
      });
    }
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
    if (products.length == 0) {
      res.json("No Product Found");
    } else {
      res.json(products);
    }
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
    const { title, price, description, category, image, rating, userid } =
      req.body;

    // Validate incoming data (you can use a validation library like Joi or validate manually)
    if (!title || !price || !category) {
      return res
        .status(400)
        .json({ error: "Title, price, and category are required" });
    }

    if (!userid) {
      return res.status(400).json({ error: "User id cannot be empty" });
    }

    // Check if the user exists
    const user = await userModel.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a new product instance
    const newProduct = new ProductModel({
      title,
      price,
      description,
      category,
      image,
      rating,
      userid, // Associate the userid with the product
    });

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

app.post("/addtocart", async (req, res) => {
  const { productId, userid } = req.body;

  if (!userid) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    // Check if the user exists
    const userExists = await userModel.findById(userid);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the product exists
    const productExists = await ProductModel.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is already in the user's cart
    const existingCartItem = await ProductCart.findOne({ userid, productId });
    if (existingCartItem) {
      return res.status(201).json({ message: "Product already in cart" });
    }

    // Add the product to the cart
    const newProductCart = new ProductCart({ userid, productId });
    await newProductCart.save();

    res
      .status(201)
      .json({ message: "Product added to cart successfully", newProductCart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .status(201)
      .json({ message: "User data saved successfully", user, token });
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
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });

    // Check if user exists
    if (!user) {
      return res
        .status(200)
        .json({ message: "Invalid email or password", userAvailable: false });
    }

    // Compare passwords securely
    const isMatch = await (password == user.password);

    // Check if passwords match
    if (!isMatch) {
      return res.status(200).json({ message: "Invalid email or password" });
    }

    // Passwords match, login successful
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      SECRET_KEY,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Login successful, send token
    res.status(200).json({
      message: "Login successful",
      userAvailable: true,
      token,
      userId: user._id,
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    console.error("Error Finding User", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/deleteproductbyid/:productId", async (req, res) => {
  const productId = req.params.productId;

  try {
    const deleteProduct = await ProductModel.findByIdAndDelete(productId);
    if (deleteProduct) {
      res.status(200).json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server Started at ${PORT}`);
  ConnectDb(URl);
});
