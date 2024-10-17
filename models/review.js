const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const reviewSchema = new Schema({
    description:String,
    rating:{
        type:Number,
        min:1,
        max:5
    },
    image: {
        url:String,
        filename: String
    },
    createdAt:{
        type: Date,
        default: new Date(Date.now())
    },
    name: String
})

module.exports = mongoose.model("Review", reviewSchema);