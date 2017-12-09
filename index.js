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
let User = require('./user-model');

// check that a user is logged in
let checkAuth = (req, res, next) => {
  //console.log("Checking authentication");
  // make sure the user has a JWT cookie
  if (typeof req.cookies.nToken === undefined || req.cookies.nToken === null) {
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
var anonElements = [];

// takes in an array of integers representing proton numbers
// and returns an element object
let createElement = (elements) => {
  console.log('creating element')
  console.log(elements.length)
  var totalProtons = 0;
  for (var j = 0; j < elements.length; j++) {
    totalProtons += elements[j];
  }

  return getElementByProtonNumber(totalProtons);
}


let getElementByProtonNumber = (protonNumber) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].protons == protonNumber) {
      return elementsArray[i];
    }
  }
}

let getElementByName = (elementName) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].name == elementName) {
      return elementsArray[i];
    }
  }
}

let sortByProtonNumber = (elements) => {
  var protons = [];
  var returnElements = [];

  for (let i = 0; i < elements.length; i++) {
    protons.push(elements[i].protons);
  }

  protons.sort((a, b) => a - b);
  console.log(protons);

  for (let i = 0; i < protons.length; i++) {
    returnElements.push(getElementByProtonNumber(protons[i]));
  }

  console.log(returnElements)
  return returnElements;
}

let storeNewElement = (element) => { // not in use rn
    // Attempt to make element saving without login
    // if element called by function is not in anonElements:
    //  store new element there
    //  call this whenever user is not logged in
    //  reset on log-in

    if (!anonElements.includes(element)) {      // if element called by function is not in anonElements:
      anonElements.push(element);               // then push element into array
    }

    // look up user by id
    User
      .findById(arguments[1].id)
      .exec()
      .then((user) => {
        console.log('saving new element to user model')
        console.log(user.unlockedElements);  // before
        user.unlockedElements.push(element);
        user.markModified('unlockedElements');
        console.log(user.unlockedElements);  // after
      });
    //} else {
      console.log('whoops');
    //}
}

// This request holds the logic to add elements to user's profile
app.post('/users/:id/new-element', (req, res) => {

  User
    .findById(req.params.id)
    .exec()
    .then((user) => {
      console.log("found user")
      var elementsToCombineJSON = req.body.elements; // JSON String
      var elementsToCombine = JSON.parse(elementsToCombineJSON);
      var newElement = createElement(elementsToCombine);

      console.log(newElement.name);

      // add new element to the user model IFF it's not already there
      var userHasElement = false;
      for (i = 0; i < user.unlockedElements.length; i++) {
        if (user.unlockedElements[i].protons == newElement.protons) {
          userHasElement = true;
        }
      }
      if (!userHasElement) {
        user.unlockedElements.push(newElement);
        user.markModified('unlockedElements');
        user.save();

        console.log("saving new element")
      }
      res.send(newElement.name);
    });
});

app.get('/', function(req, res) {
  if (req.user) {
    User
    .findById(req.user.id)
    .exec()
    .then((user) => {
        var elementsToCombine = sortByProtonNumber(user.unlockedElements)
        var elementsJSON = JSON.stringify(elementsToCombine);

        // if the user doesn't have an elements array, initialize it
        if (!elementsToCombine || elementsToCombine.length == 0) {
          var h = getElementByName('Hydrogen');
          user.unlockedElements.push(h);
          user.save();
          elementsToCombine = [h];
          var elementsJSON = JSON.stringify(elementsToCombine); // could also use reducer
        }
        res.render('home', {elementsToCombine, elementsJSON, currentUser: req.user.id});
    })
  } else {
    console.log("user not found")

    // Checks to see if no anonymous elements have been stored and, if so, stores hydrogen
    if (!anonElements || anonElements.length == 0) {
      var h = getElementByName('Hydrogen');
      storeNewElement(h);
      elementsToCombine = [h];
      var elementsJSON = JSON.stringify(elementsToCombine);
    }
    elementsToCombine = sortByProtonNumber(elementsToCombine);
    console.log(elementsJSON)
    // get anonElements and render
    res.render('home', {elements: elementsToCombine, elementsJSON});
  }
})

// authentication controller
require('./auth.js')(app);

var PORT = process.env.PORT || 3000;

app.listen(PORT, function(req, res) {
  console.log('listening');
});
