//**** dependencies ****//
const express = require('express');
const app = express();
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

//**** middleware ****//
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// set up handlebars
app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// user database model
var User = require('./user-model');

var elementsToCombine = ['H', 'H'];

// check that a user is logged in
var checkAuth = function (req, res, next) {
  //console.log("Checking authentication");
  // make sure the user has a JWT cookie
  if (typeof req.cookies.nToken === 'undefined' || req.cookies.nToken === null) {
    req.user = null;
    //console.log("no user");
  } else {
    // if the user has a JWT cookie, decode it and set the user
    var token = req.cookies.nToken;
    var decodedToken = jwt.decode(token, { complete: true }) || {};
    req.user = decodedToken.payload;
  }
  next();
}
app.use(checkAuth);

/***** set up mongoose *****/
mongoose.promise = global.promise;
mongoose.connect('mongodb://heroku_1kx55dgr:6bisnk21n4op7sprqve5ji6s88@ds149905.mlab.com:49905/heroku_1kx55dgr');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

const elementsArray = require('./elements.json');

var createElement = (elements) => {
  var totalProtons = 0;
  for (let i = 0; i < elements.length; i++) {
    totalProtons += elements[i].protons;
  }
  return getElementByProtonNumber(totalProtons).name;
}

var getElementByProtonNumber = (protonNumber) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].protons == protonNumber) {
      return elementsArray[i];
    }
  }
}

var getElementByAbbrv = (elementAbbrv) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].abbrv == elementAbbrv) {
      //console.log(elementsArray[i])
      return elementsArray[i];
    }
  }
}

var getElementByName = (elementName) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].name == elementName) {
      //console.log(elementsArray[i])
      return elementsArray[i];
    }
  }
}

app.get('/', function(req, res) {
  var elementsToCombine;
  if (req.user) {
    console.log("user " + req.user);
    User.findById(req.user.id).exec().then((user) => {
        elementsToCombine = user.unlockedElements;
        if (!elementsToCombine || elementsToCombine.length == 0) {
          var h = getElementByAbbrv('H');
          elementsToCombine = [h, h];
        }
        console.log(elementsToCombine);
        res.render('home', {elements: elementsToCombine, currentUser: req.user});
    })
  } else {
    elementsToCombine = [getElementByAbbrv('H'), getElementByAbbrv('H')];
    var newElement = createElement(elementsToCombine);
    res.render('home', {elements: elementsToCombine, currentUser: req.user});
  }
})

// authentication controller
require('./auth.js')(app);

var PORT = process.env.PORT || 3000;

app.listen(PORT, function(req, res) {
  console.log('listening');
});
