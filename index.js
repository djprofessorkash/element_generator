const express = require('express');
const app = express();
const hb = require('express-handlebars');

app.get('/', function(req, res) {
  res.send("Element Generator");
})

var PORT = process.env.PORT || 3000;

app.listen(PORT, function(req, res) {
  console.log("listening!");
});
