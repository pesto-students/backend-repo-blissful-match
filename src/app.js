const express = require('express');
const helmet = require('helmet');
const connectDB = require('./config/db'); // Import the connection function
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
app.use(bodyParser.json());
const config = require('./config/config');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet.frameguard());
app.use(helmet.hsts({maxAge: 5184000}));
app.use(helmet.noSniff())

const fileUpload = require('express-fileupload');
app.use(fileUpload({
  limits: { fileSize: config.AWS_FILE_UPLOAD_LIMIT * 1024 * 1024 },
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static('images')); 
app.use('/public', express.static('public')); 
app.use('/public/images/users/profiles', express.static('public/images/users/profiles')); 
app.use('/public/images/users/aadhar', express.static('public/images/users/aadhar')); 
app.use('/public/images/users/astro', express.static('public/images/users/astro')); 
app.use('/public/images/users/pan', express.static('public/images/users/pan')); 
app.use('/public/images/users/story', express.static('public/images/users/story')); 
app.use('/public/images/users/gallery', express.static('public/images/users/gallery')); 

app.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token, devicetype, countrycode, timezoneoffset');
  res.header('Access-Control-Expose-Headers', 'x-access-token, Authorization');
  if(req.method === "OPTIONS"){
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    return res.status(200).json({});
  }
  process.on('uncaughtException', function(err) {
    console.log("Main error: ",err)
  });
  next();
});

connectDB();

const userRoutes = require('./routes/userRoutes');
const commonRoutes = require('./routes/commonRoutes');
const plansPaymentRoutes = require('./routes/plansNdPaymentsRoutes');
const successStories = require('./routes/storyRoutes');

app.use('/user', userRoutes);
app.use('/common', commonRoutes);
app.use('/plans', plansPaymentRoutes);
app.use('/payment', plansPaymentRoutes);
app.use('/success-stories', successStories);

module.exports = app;