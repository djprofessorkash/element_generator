// ================================================================================
// ================================================================================
// NAME: auth.js
// DESCRIPTION: Authentication file with routes and logic for user access. 
// ================================================================================
// ================================================================================


// ================================================================================
// ================================= INITIALIZERS =================================
// ================================================================================


const bodyParser = require("body-parser");              // Requires Body-Parser
const User = require("./user-model");                   // Requires User Model
const jwt = require("jsonwebtoken");                    // Requires JSON Web Token


// ================================================================================
// ============================== MODULE DECLARATION ==============================
// ================================================================================


module.exports = (app) => {

  // ==============================================================================
  // ============================= MODULAR FUNCTIONS ==============================
  // ==============================================================================


    // ================ FUNCTION TO SEQUENTIALLY SAVE EACH ELEMENT ================
    let displayElementsInProfile = (unlockedElements) => {
      let listOfUnlockedElements = [];
  
      for (let iterator = 0; iterator < unlockedElements.length; iterator++) {
        console.log(unlockedElements[iterator].name);
        // console.log(unlockedElements[iterator].abbrv);
        listOfUnlockedElements.push(unlockedElements[iterator].name);
      }
  
      console.log(listOfUnlockedElements);
      return listOfUnlockedElements;
    }


  // ==============================================================================
  // ============================== MODULAR ROUTES ================================
  // ==============================================================================

  // ========================= GET REQUEST TO LOGIN USER ==========================
  app.get("/login", (req, res) => {
    res.redirect("/");
  });

  // ====== POST REQUEST TO SEND DATA VIA POST REQUEST TO LOGIN (CHECK USER) ======
  app.post("/login", function(req, res, next) {

    // Check if user exists from login data, then successfully login or redirect
    User
      .findOne({ username: req.body.username }, "+password", (err, user) => {
        if (!user) {
          console.log("USER NOT FOUND.");
          return res.render("home", {warningMessage: "Wrong username or password."});
        };

        // Verify password and JWT (SECRET) validity for successful login
        user
          .comparePassword(req.body.password, (err, isMatch) => {
            if (!isMatch) {
              console.log("PASSWORD IS INCORRECT.");
              return res.render("home", {warningMessage: "Wrong username or password."});
            }

            let token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: "60 days" });

            res.cookie("nToken", token, { maxAge: 900000, httpOnly: true });
            res.redirect("/");
          });
      });
  });

  // ======================== GET REQUEST TO SIGN UP USER =========================
  app.get("/sign-up", (req, res) => {
    res.redirect("/");
  })

  // ======================== POST REQUEST TO SIGN UP USER ========================
  app.post("/sign-up", (req, res, next) => {
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

  // ==================== GET REQUEST TO ACCESS USER PROFILE ======================
  app.get("/profile", (req, res) => {

    // Check if users exists, then display unlocked user elements in profile
    if (req.user) {
      User
        .findById(req.user.id)
        .exec()
        .then((user) => {
          console.log("USER FOUND.");

          let unlockedElementsInTable = user.unlockedElements;
          // displayElementsInProfile(unlockedElementsInTable);
          console.log("UNLOCKED ELEMENTS IN TABLE: ");
          console.log(unlockedElementsInTable);

          res.render("profile", { currentUser: user, unlockedElementsInTable });
        }).catch((err) => {
          console.error(err.message);
        });
    }
    else {
      console.log("USER NOT FOUND.");
      res.redirect("/");
    }
  });

  // ======================== GET REQUEST TO LOG OUT USER =========================
  app.get("/logout", (req, res) => {
    res.clearCookie("nToken");
    res.redirect("/");
  });
}
