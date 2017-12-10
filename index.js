// ================================================================================
// ================================================================================
// NAME: index.js
// DESCRIPTION: Main web app file with full-stack integration.
// ================================================================================
// ================================================================================


// ================================================================================
// ============= IMPORT STATEMENTS, REQUIREMENTS, AND CONFIGURATIONS ==============
// ================================================================================


const express = require("express");                     // Requires Express.js
const app = express();                                  // Configures Express
const hb = require("express-handlebars");               // Requires Handlebars
const bodyParser = require("body-parser");              // Requires Body-Parser
const cookieParser = require("cookie-parser");          // Requires Cookie-Parser
const bcrypt = require("bcrypt");                       // Requires Blowfish Crypt
const jwt = require("jsonwebtoken");                    // Requires JSON Web Token
const mongoose = require("mongoose");                   // Requires Mongoose

require("dotenv").config();                             // Configures .env


// ================================================================================
// ================================= INITIALIZERS =================================
// ================================================================================


app.use(bodyParser.urlencoded({ extended: true }));       // Initializes Body-Parser
app.use(bodyParser.json());
app.use(cookieParser());                                  // Initializes Cookie-Parser
app.use(express.static("public"));                        // Initializes Express

app.engine("handlebars", hb({ defaultLayout: "main" }));  // Initializes Handlebars
app.set("view engine", "handlebars");

mongoose.promise = global.promise;                        // Initialize Mongoose
mongoose.connect("mongodb://heroku_1kx55dgr:6bisnk21n4op7sprqve5ji6s88@ds149905.mlab.com:49905/heroku_1kx55dgr");

var db = mongoose.connection;                             // Connect to database
db.on("error", console.error.bind(console, "connection error:"));

const User = require("./user-model");                     // Requires User Model

const elementsArray = require('./elements.json');         // Requires Elements JSON (NOTE: Switch to Elements Dictionary JSON)

let port = process.env.PORT || 3000;                      // Initialize local hosting port
let anonElements = [];                                    // Initialize Elements object for anonymous user


// ================================================================================
// =============================== GLOBAL FUNCTIONS ===============================
// ================================================================================


// ===================== FUNCTION TO CHECK USER AUTHENTICATION ====================
let checkAuth = (req, res, next) => {
  // console.log("CHECKING AUTHENTICATION...");

  // Ensure user has appropriate authentication token
  if (typeof req.cookies.nToken === undefined || req.cookies.nToken === null) {
    req.user = null;
    // console.log("USER NOT FOUND.");
  } else {
    // If user has JSONWebToken cookie, decode cookie and authorize user
    // console.log("USER FOUND.");
    let token = req.cookies.nToken;
    let decodedToken = jwt.decode(token, { complete: true }) || {};
    req.user = decodedToken.payload;
  }
  next();
}

app.use(checkAuth);                   // Initialize user authentication
require("./auth.js")(app);            // Requires Authentication Controller


// ================================================================================
// =============================== GLOBAL FUNCTIONS ===============================
// ================================================================================


// ================= FUNCTION TO CREATE ELEMENT FROM PROTON COUNT =================
let createElement = (elements) => {
  console.log("CREATING ELEMENT...");
  console.log(elements.length);

  let totalProtons = 0;

  if (elements.length < 2) {
    totalProtons = 2 * elements[0];
  }
  else {
    for (let iterator = 0; iterator < elements.length; iterator++) {
      totalProtons += elements[iterator];
    }
  }
  return getElementByProtonNumber(totalProtons);
}

// =================== FUNCTION TO GET ELEMENT BY PROTON COUNT ====================
let getElementByProtonNumber = (protonNumber) => {
  for (let iterator = 0; iterator < elementsArray.length; iterator++) {
    if (elementsArray[iterator].protons == protonNumber) {
      return elementsArray[iterator];
    }
  }
}

// ======================= FUNCTION TO GET ELEMENT BY NAME ========================
let getElementByName = (elementName) => {
  for (let iterator = 0; iterator < elementsArray.length; iterator++) {
    if (elementsArray[iterator].name == elementName) {
      return elementsArray[iterator];
    }
  }
}

// =================== FUNCTION TO SORT ELEMENTS BY PROTON COUNT ==================
let sortByProtonNumber = (elements) => {
  let protons = [];
  let returnElements = [];

  for (let iterator = 0; iterator < elements.length; iterator++) {
    protons.push(elements[iterator].protons);
  }

  protons.sort((a, b) => a - b);              // Sorts array by differences in proton count
  console.log(protons);

  for (let iterator = 0; iterator < protons.length; iterator++) {
    returnElements.push(getElementByProtonNumber(protons[iterator]));
  }

  console.log(returnElements)
  return returnElements;
}

// ================ FUNCTION TO STORE ELEMENTS FOR ANONYMOUS USERS ================
// ============================= (CURRENTLY DISUSED) ==============================
let storeNewElement = (element) => {
    if (!anonElements.includes(element)) {
      anonElements.push(element);
    }

    // Look up user ID, then save anonymous element to common profile
    User
      .findById(arguments[1].id)
      .exec()
      .then((user) => {
        console.log("SAVING NEW ELEMENT TO ANONYMOUS USER MODEL.");
        // console.log(user.unlockedElements);

        user.unlockedElements.push(element);
        user.markModified("unlockedElements");

        // console.log(user.unlockedElements);
      }).catch((err) => {
        console.log("ANONYMOUS ELEMENT STORAGE ERROR.");
        console.error(err.message);
      })
}


// ================================================================================
// ============================== RESOURCEFUL ROUTES ==============================
// ================================================================================


// ================ POST REQUEST TO ADD ELEMENT(S) TO USER ACCOUNT ================
app.post("/users/:id/new-element", (req, res) => {

  // Find user ID, then save calculated element to user profile if not already there
  User
    .findById(req.params.id)
    .exec()
    .then((user) => {
      console.log("USER FOUND.");

      let elementsToCombineJSON = req.body.elements;
      let elementsToCombine = JSON.parse(elementsToCombineJSON);

      for (let iterator = 0; iterator < elementsToCombine.length; iterator++) {
        elementsToCombine[iterator] = parseInt(elementsToCombine[iterator]);
      }

      let newElement = createElement(elementsToCombine);
      console.log("NEW ELEMENT NAME: " + newElement.name);

      // If new element is not already unlocked, add it to user profile
      let userHasElement = false;

      for (let iterator = 0; iterator < user.unlockedElements.length; iterator++) {
        if (user.unlockedElements[iterator].protons == newElement.protons) {
          userHasElement = true;
        }
      }
      if (!userHasElement) {
        user.unlockedElements.push(newElement);
        user.markModified("unlockedElements");
        user.save();

        console.log("SAVING NEW ELEMENT...");
      }
      res.send(newElement.name);
    });
});

// =============== GET REQUEST TO INITIALIZE USER'S ELEMENT STORAGE ===============
app.get("/", function(req, res) {
  if (req.user) {

    // Initialize starting elemental storage for authenticated or anonymous user
    User
    .findById(req.user.id)
    .exec()
    .then((user) => {
        let elementsToCombine = sortByProtonNumber(user.unlockedElements)
        let elementsJSON = JSON.stringify(elementsToCombine);

        if (!elementsToCombine || elementsToCombine.length == 0) {
          let h = getElementByName("Hydrogen");
          user.unlockedElements.push(h);
          user.save();

          elementsToCombine = [h];
          let elementsJSON = JSON.stringify(elementsToCombine); // OPTION: Could use Reducer here
        }
        res.render("home", {elementsToCombine, elementsJSON, currentUser: req.user.id});
    }); 
  } 
  else {
    console.log("USER NOT FOUND.");

    // Checks to see if no anonymous elements have been stored and, if so, stores Hydrogen
    if (!anonElements || anonElements.length == 0) {
      let h = getElementByName("Hydrogen");
      storeNewElement(h);

      elementsToCombine = [h];
      let elementsJSON = JSON.stringify(elementsToCombine);
    }

    elementsToCombine = sortByProtonNumber(elementsToCombine);
    console.log(elementsJSON);

    // Get and render stored anonymous elements
    res.render("home", {elements: elementsToCombine, elementsJSON});
  }
});

// ========================= SERVER LISTENER ON LOCAL PORT ========================
app.listen(port, (req, res) => {
  console.log(`NUCLEUS APP LISTENING ON PORT ${port}.`);
});
