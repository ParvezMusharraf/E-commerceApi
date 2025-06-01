const express = require("express");
const ConnectDb = require("./connectdb");
// const URl = "mongodb://0.0.0.0:27017/Testing";
const URl =
  "mongodb+srv://parvezmusharraf61:parvez3344@cluster0.5b50qms.mongodb.net/cluster0?retryWrites=true&w=majority&appName=Cluster0";
const ProductJson = require("./product.json");
const app = express();
const PORT = 3000;
const ProductModel = require("./models/Product");
const UserModel = require("./models/userModel");
var cors = require("cors");
const userModel = require("./models/userModel");
const ProductCart = require("./models/cart");
const jwt = require("jsonwebtoken");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swaggerConfig");
app.use(express.json());
app.use(cors());

const JWT_SECRET = "I am really a good boy"; // You should store this in an environment variable for better security

// ALL PRODUCT API REQ

/**
 * @swagger
 * /Allproducts:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get("/Allproducts", async (req, res) => {
  try {
    const products = await ProductModel.find({});
    if (products.length > 0) {
      res.json(products);
    } else res.json("No Product Found");
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /allProductListByUserId:
 *   post:
 *     summary: Get products by user ID
 *     description: Retrieve a list of products associated with a specific user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userid:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
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

/**
 * @swagger
 * /AllproductsByCategory:
 *   get:
 *     summary: Get products by category
 *     description: Retrieve a list of products based on category
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: Category of the products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get("/AllproductsByCategory", async (req, res) => {
  try {
    const { category } = req.query;
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

/**
 * @swagger
 * /getAddToCart:
 *   get:
 *     summary: Get products in the cart by user ID
 *     description: Retrieve products added to the cart by a specific user
 *     parameters:
 *       - in: query
 *         name: userid
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: A list of products in the cart
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get("/getAddToCart", async (req, res) => {
  try {
    const { userid } = req.query;
    if (!userid) {
      return res.status(400).json({ message: "User Id required" });
    }
    const data = await ProductCart.find({ userid });
    if (data.length === 0) {
      return res
        .status(404)
        .json({ message: "No product found for the selected user" });
    }
    const productIds = data.map((item) => item.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /getAllCatagoryList:
 *   get:
 *     summary: Get all product categories
 *     description: Retrieve a list of all product categories
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
app.get("/getAllCatagoryList", async (req, res) => {
  try {
    const categories = await ProductModel.aggregate([
      { $group: { _id: "$category", image: { $first: "$image" } } },
      { $project: { categoryName: "$_id", category: 1, image: 1, _id: 0 } },
    ]);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /SaveProduct:
 *   post:
 *     summary: Save a new product
 *     description: Add a new product to the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *               rating:
 *                 type: number
 *               userid:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Missing required fields
 */
app.post("/SaveProduct", async (req, res) => {
  try {
    const { title, price, description, category, image, rating, userid } =
      req.body;

    if (!title || !price || !category) {
      return res
        .status(400)
        .json({ error: "Title, price, and category are required" });
    }

    if (!userid) {
      return res.status(400).json({ error: "User id cannot be empty" });
    }

    const user = await UserModel.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newProduct = new ProductModel({
      title,
      price,
      description,
      category,
      image,
      rating,
      userid,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /addtocart:
 *   post:
 *     summary: Add a product to the cart
 *     description: Add a product to a user's cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               userid:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added to cart successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: User not found
 */
app.post("/addtocart", async (req, res) => {
  try {
    const { productId, userid } = req.body;
    if (!productId || !userid) {
      return res.status(400).json({ error: "Product Id and User Id required" });
    }
    const user = await UserModel.findById(userid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cartItem = new ProductCart({
      productId,
      userid,
    });

    await cartItem.save();
    res.status(201).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /removeCart/item:
 *   delete:
 *     summary: Remove a product from the user's cart
 *     description: Deletes a product from the user's cart using the product ID and user ID from query parameters.
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the product to remove from the cart.
 *         example: 64f6c7d8924532b24cf0783e
 *       - in: query
 *         name: userid
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose cart is being modified.
 *         example: 64f6c7d8924532b24cf0783f
 *     responses:
 *       200:
 *         description: Product removed from cart successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *       400:
 *         description: Bad request. The request may be missing the productId or userid, or the item/user may not be found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Product Id and User Id required
 *       404:
 *         description: Not found. The product or user does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found in system
 *       500:
 *         description: Internal server error. An error occurred on the server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */

app.delete("/removeCart/item", async (req, res) => {
  try {
    const { productId, userid } = req.query;
    if (!productId || !userid) {
      return res.status(400).json({ error: "Product Id and User Id required" });
    }
    const user = await userModel.findById(userid);
    if (!user) {
      return res.status(400).json({ error: "user not found in system" });
    }
    const cartItem = ProductModel.find({ productId, userid });
    if (!cartItem) {
      return res.status(400).json({ error: "item not found" });
    }

    await ProductCart.deleteOne({ productId, userid });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /signin:
 *   post:
 *     summary: User sign-in
 *     description: Authenticate a user and return a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email, password });
    if (user) {
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.status(200).json({
        token,
        userId: user._id,
        username: user.username,
        userAvailable: true,
        message: "User Login Succefully",
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: User sign-up
 *     description: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing required fields
 */
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUserName = await UserModel.findOne({ username: req.body.username });
    if (existingUserName) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = new UserModel({
      username,
      email,
      password,
    });

    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/suggestions", async (req, res) => {
  try {
    const { term } = req.query;

    // Regex search for title and category
    const regex = new RegExp(term, "i");
    const products = await ProductModel.find({
      $or: [{ title: { $regex: regex } }, { category: { $regex: regex } }],
    }).select("title category"); // Only return title and category

    const suggestions = products;

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching suggestions", error });
  }
});

app.get("/productdetailsbyId", async (req, res) => {
  try {
    const { productId } = req.query; // Destructure productId from req.query

    if (productId) {
      const isAvailable = await ProductModel.findById(productId); // Await the promise
      if (isAvailable) {
        const allCategoryList = await ProductModel.find({
          category: isAvailable.category,
        });
        const allProductList = [isAvailable, ...allCategoryList];
        res.status(200).json(allProductList); // Send the product data
      } else {
        res
          .status(404)
          .json({ message: "No Product Found For the selected Id" }); // Product not found
      }
    } else {
      res.status(400).json({ message: "Product Id is required" }); // Bad request if no ID is provided
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error }); // Handle error
  }
});

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Server Started at ${PORT}`);
  ConnectDb(URl);
});
