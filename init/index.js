const mongoose = require("mongoose");
const Product = require("../models/product.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/testimonial";


main()
.then(() =>{
    console.log("connected to DB");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

