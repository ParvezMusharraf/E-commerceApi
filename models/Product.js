const mongoose = require("mongoose") 


const productSchema = new mongoose.Schema({
   title: {
       type: String
   },
   price: {
       type: Number
   },
   description: {
       type: String
   },
   category: {
       type: String
   },
   image: {
       type: String
   },
   rating: {
       rate: {
           type: String
       },
       count: {
           type: Number
       }
   }
});


module.exports = mongoose.model("Product",productSchema)