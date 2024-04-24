const mongoose = require("mongoose")

const ConnectDb = (url)=>{
    mongoose.connect(url).then((res)=>{
        console.log("Connected To Db Successfully")
    }).catch((err)=>{
        console.log(err)
    })
}


module.exports= ConnectDb;