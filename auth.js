var bodyParser = require('body-parser');
var User = require('./user-model');
var jwt = require('jsonwebtoken');

module.exports = function(app) {

  // post login
  app.post('/login', function(req, res, next) {
    User.findOne({ username: req.body.username }, "+password", function (err, user) {
      if (!user) { return res.status(401).send({ message: 'Wrong username or password' }) };
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (!isMatch) {
          return res.status(401).send({ message: 'Wrong username or password' });
        }
        var token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: "60 days" });
        res.cookie('nToken', token, { maxAge: 900000, httpOnly: true });
        res.redirect('/');
      });
    });
  });

  // logout
  app.get('/logout', function(req, res) {
    res.clearCookie('nToken');
    res.redirect('/');
  });

  app.get('/login', function(req, res) {
    res.redirect('/')
  })

  app.get('/sign-up', function(req, res) {
    res.redirect('/')
  })

  app.get('/profile', function(req, res) {
    res.render('profile');
  })

  // sign-up
  app.post('/sign-up', function(req, res, next) {
    // create User and JWT
    var user = new User(req.body);

    user.save(function (err) {
      if (err) {
        return res.status(400).send({ err: err });
      }
      // generate a JWT for this user from the user's id and the secret key
      var token = jwt.sign({ id: user.id}, process.env.SECRET, { expiresIn: "60 days"});
      // set the jwt as a cookie so that it will be included in
      // future request from this user's client
      res.cookie('nToken', token, { maxAge: 900000, httpOnly: true});
      res.redirect('/');
    })
  });
}
