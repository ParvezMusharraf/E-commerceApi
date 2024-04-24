const axios = require("axios")
const connectDb = require('./connectdb')
const ProductModel = require('./models/Product')
const URl = "mongodb://0.0.0.0:27017/Testing"
let data = []

const getAllProductList = async()=>{
    const res =  await axios.get("https://fakestoreapi.com/products")
    // console.log(res)
    return res.data; // Return the array of products
}

const start = async()=>{
    const Products = await getAllProductList()
    // console.log(newData)
    await connectDb(URl)
    console.log("connected to dbs")
    await ProductModel.deleteMany()

    for(const p of Products){
        await ProductModel.create(p)
    }
    console.log("data saved sussefully")
}

start()
