var bodyParser = require('body-parser');
var User = require('./user-model');
var jwt = require('jsonwebtoken');

module.exports = (app) => {

  // post login
  app.post('/login', function(req, res, next) {
    User
      .findOne({ username: req.body.username }, "+password", (err, user) => {
        if (!user) { 
          return res.status(401).send({ message: 'Wrong username or password' });
        };

        user.comparePassword(req.body.password, (err, isMatch) => {
          if (!isMatch) {
            return res.status(401).send({ message: 'Wrong username or password' });
          }

          let token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: "60 days" });

          res.cookie('nToken', token, { maxAge: 900000, httpOnly: true });
          res.redirect('/');
        });
      });
  });

  // logout
  app.get('/logout', (req, res) => {
    res.clearCookie('nToken');
    res.redirect('/');
  });

  app.get('/login', (req, res) => {
    res.redirect('/');
  })

  app.get('/sign-up', (req, res) => {
    res.redirect('/');
  })

  app.get("/profile", (req, res) => {
    if (req.user) {
      User
        .findById(req.user.id)
        .exec()
        .then((user) => {
          console.log("User Found");
          res.render("profile");          
        }).catch((err) => {
          console.error(err.message);
        });
    }
    else {
      console.log("User Not Found");
      res.redirect("/");
    }
  })

  // sign-up
  app.post('/sign-up', (req, res, next) => {
    // create User and JWT
    let user = new User(req.body);

    user.save((err) => {
      if (err) {
        return res.status(400).send({ err: err });
      }
      // generate a JWT for this user from the user's id and the secret key
      let token = jwt.sign({ id: user.id}, process.env.SECRET, { expiresIn: "60 days"});
      // set the jwt as a cookie so that it will be included in
      // future request from this user's client
      res.cookie('nToken', token, { maxAge: 900000, httpOnly: true});
      res.redirect('/');
    })
  });
}
