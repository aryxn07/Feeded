if(process.env.NODE_ENV != "production"){
  require("dotenv").config()
}

const express = require('express');
const app = express();
const mongoose = require("mongoose");
const ejsMate = require('ejs-mate');
const path = require('path')
const methodOverride = require("method-override");
const Product = require("./models/product.js");
const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multer = require("multer");
const{storage} = require("./cloudConfig.js");
const upload = multer({storage});

const dbUrl = process.env.ATLASDB_URL;

main()
.then(() =>{
    console.log("connected to DB");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.urlencoded({extended: true}));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, '/public')))
app.use(methodOverride("_method"));


const store =MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
      secret:process.env.SECRET,
  },
  touchAfter: 24*3600,
})

store.on("error", () =>{
  console.log("ERROR in MONGO SESSION STORE",err);
})

const sessionOptions ={
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
  res.locals.success= req.flash("success");
  res.locals.error= req.flash("error");
  res.locals.currUser= req.user;
  next();
})


app.get("/index",(req,res) =>{
  res.render("testimonial/index.ejs");
})

app.get("/dashboard", async (req,res) =>{
  if(!req.isAuthenticated()){
    req.flash("error", "You need to login to get started !");
   return res.redirect("/login");
  }
  const user = await User.findById(req.user.id).populate("products");
  res.render("testimonial/dashboard.ejs", {user});
})

app.post("/dashboard", upload.single('product[image]'), async(req,res)=>{
  let url =req.file.path;
  let filename= req.file.filename;

  let user = await User.findById(req.user.id);
  const newProduct =new Product(req.body.product)

  newProduct.owner=user.username;
  newProduct.image={url,filename};
  console.log(newProduct);
  
  user.products.push(newProduct);
  await newProduct.save();
  await user.save();

  req.flash("success", "New Product Added!");
  res.redirect("/dashboard");
})

app.get("/new", (req,res) =>{
  if(!req.isAuthenticated()){
    req.flash("error", "You are not logged in!");
   return res.redirect("/login");
  }
res.render("testimonial/new.ejs");
})

app.get("/product/:name", async (req,res) =>{
  let {name} = req.params;
  const product = await Product.findOne({name:name}).populate("reviews");
  res.render("testimonial/product.ejs",{product});
})

app.delete("/product/:name", async (req,res) =>{
  let deletedProduct = await Product.findOneAndDelete({name:req.params.name}); 
    console.log(deletedProduct);
    req.flash("error", "Product Deleted !");
  res.redirect("/dashboard");
})

//-------------Review----------------
app.get("/:name/reviews", async (req,res) =>{
  const product = await Product.findOne({name:req.params.name})
  res.render("testimonial/review.ejs",{product});
})

app.post("/:name/reviews", upload.single('review[image]'), async (req,res) =>{
  let url =req.file.path;
  let filename= req.file.filename;

  let product = await Product.findOne({name:req.params.name});
  let newReview = new Review(req.body.review);

  newReview.image={url,filename};
  product.reviews.push(newReview);

  await newReview.save();
  await product.save();
  req.flash("success", "New Review Added!");
  res.redirect(`/product/${product.name}`);
  console.log("New review saved");
})

app.delete("/:name/:reviewId", async(req,res) =>{
  let {name,reviewId} = req.params;
  await Product.findOneAndUpdate({name: name},{$pull: {reviews:reviewId}});
    let deletedReview= await Review.findByIdAndDelete(reviewId);
    console.log(deletedReview);
    req.flash("error", "Review Deleted !");
    res.redirect(`/product/${name}`);
})

//-------signup--------
app.get("/signup", (req,res) =>{
  res.render("users/signup.ejs");
})

app.post("/signup", async (req,res) =>{
  try{
  let {username,email,password} = req.body;
  const newUser = new User({email,username});
  const registredUser =await User.register(newUser,password);
  console.log(registredUser);
  
  req.login(registredUser,(err) =>{
    if(err){
      return next(err);
    }
    req.flash("success", `Welcome ${req.user.username} !`); 
    res.redirect("/index");
  })
  } catch(e){
    req.flash("error", "Username already taken !");
    res.redirect("/index");
    console.log(e);
  }
  
})

//-----------login-------------
app.get("/login", (req,res) =>{
  res.render("users/login.ejs");
})

app.post("/login", passport.authenticate("local", {failureRedirect: "/login" , failureFlash: true}) , async (req,res) =>{

  req.flash("success", `Welcome ${req.user.username} !`);
  res.redirect("/dashboard");
})

//----------logout-------------
app.get("/logout", (req,res,next) =>{
  req.logout((err) =>{
    if(err){
      return next(err);
    }
    req.flash("success", "You are logged out !");
    res.redirect("/index");
  })
})


app.listen(8080, () =>{
  console.log("server is listening to port 8080");
})
