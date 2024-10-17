const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require("./product.js");
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    products:[
        {
            type:Schema.Types.ObjectId,
            ref: "Product"
        }
    ]
});

// hashing & salting kar dega + authenticate jaise methods available hai isme
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);