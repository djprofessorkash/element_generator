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

// set up handlebars
app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

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
      console.log(elementsArray[i])
      return elementsArray[i];
    }
  }
}

app.get('/', function(req, res) {
  for (let i = 0; i < elementsArray.length; i++) {
    console.log(elementsArray[i]);
  }
  var elementsToCombine = [getElementByAbbrv('H'), getElementByAbbrv('H')];
  var newElement = createElement(elementsToCombine);
  res.render('home', {element: 'Hydrogen'});
})

var PORT = process.env.PORT || 3000;

app.listen(PORT, function(req, res) {
  console.log('listening');
});
