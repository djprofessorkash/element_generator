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

let createElement = (elements) => {
  let totalProtons = 0;
  for (let i = 0; i < elements.length; i++) {
    totalProtons += elements[i].protons;
  }
  return getElementByProtonNumber(totalProtons);
}

let storeNewElement = (element) => {
  // check if the user exists
  if (arguments[1]) {
    console.log(arguments[1].id);
    // look up user by id

    User.findById(arguments[1].id).exec().then((user) => {
      console.log('saving new element to user model')
      console.log(user.unlockedElements);  // before
      user.unlockedElements.push(element);
      user.markModified('unlockedElements');
      console.log(user.unlockedElements);  // after
    });
  } else {
    console.log('whoops');
  }
}

let getElementByProtonNumber = (protonNumber) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].protons == protonNumber) {
      return elementsArray[i];
    }
  }
}

let getElementByAbbrv = (elementAbbrv) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].abbrv == elementAbbrv) {
      //console.log(elementsArray[i])
      return elementsArray[i];
    }
  }
}

let getElementByName = (elementName) => {
  for (let i = 0; i < elementsArray.length; i++) {
    if (elementsArray[i].name == elementName) {
      //console.log(elementsArray[i])
      return elementsArray[i];
    }
  }
}

app.post('/users/:id/new-element', function(req, res) {
  User.findById(req.params.id).exec().then((user) => {
    var elementsToCombine = req.body.elements; // array of objects
    var newElement = createElement(elementsToCombine);

    // add new element to the user model
    user.unlockedElements.push(newElement);
    user.markModified('unlockedElements');
    return {
      "name": newElement.name
    }
  }).then((newElementJSON) => {
    res.send(newElementJSON);
  })
})

app.get('/', function(req, res) {
  if (req.user) {
    User.findById(req.user.id).exec().then((user) => {
        var elementsToCombine = user.unlockedElements;
        if (!elementsToCombine || elementsToCombine.length == 0) {
          var h = getElementByAbbrv('H');
          user.unlockedElements.push(h);
          user.unlockedElements.push(h);
          user.save();
          elementsToCombine = [h, h];
        }
        console.log(elementsToCombine);
        res.render('home', {elements: elementsToCombine, currentUser: req.user});
    })
  } else {
    var h = getElementByAbbrv('H');
    elementsToCombine = [h, h];
    res.render('home', {elements: elementsToCombine, currentUser: req.user});
  }
})

// authentication controller
require('./auth.js')(app);

var PORT = process.env.PORT || 3000;

app.listen(PORT, function(req, res) {
  console.log('listening');
});
