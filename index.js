const express = require('express');
const app = express();
const hb = require('express-handlebars');

// set up handlebars
app.engine('handlebars', hb({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

const elementsArray = require('./elements.json');

var createElement = (elements) => {
  var totalProtons = 0;
  for (let i = 0; i < elements.length; i++) {
    totalProtons += elements[i].protons;
  }
  console.log('You just made: ' + getElementByProtonNumber(totalProtons).name)
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
  createElement(elementsToCombine);
  res.render('home');
})

var PORT = process.env.PORT || 3000;

app.listen(PORT, function(req, res) {
  console.log('listening');
});
