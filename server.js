const express = require("express")
const ConnectDb = require("./connectdb")
const URl = "mongodb://0.0.0.0:27017/Testing"
const ProductJson = require('./product.json')
const app = express()
const PORT = 3000
const ProductModel = require("./models/Product")
var cors = require('cors')

app.use(cors())
app.get("/Allproducts",async(req,res)=>{
 try {
    // Fetch all products from the database
    const products = await ProductModel.find({});
    res.json(products);
} catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
})

app.listen(PORT,()=>{
    console.log(`Server Started at ${PORT}`)
    ConnectDb(URl)
})