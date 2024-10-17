const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const productSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        url:String,
        filename: String
    },
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner:{
        type:String,       
    }
})

productSchema.post("findOneAndDelete", async (product) =>{
    if(product){
        await Review.deleteMany({_id: {$in: product.reviews}});
    }
})

const Product = mongoose.model("Product", productSchema);
module.exports = Product;