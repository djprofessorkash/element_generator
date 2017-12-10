// ================================================================================
// ================================================================================
// NAME: user-model.js
// DESCRIPTION: File holding and manipulating MongoDB model with user information.
// ================================================================================
// ================================================================================


// ================================================================================
// ====================== INITIALIZERS AND DEFINING DATABASE ======================
// ================================================================================


const mongoose = require("mongoose");                 // Requires Mongoose
const bcrypt = require("bcrypt");                     // Requires Blowfish-Crypt
const Schema = mongoose.Schema;                       // Initializes use of Schema

const UserSchema = new Schema({                       // Creates User Schema
    createdAt       : { type: Date },
    updatedAt       : { type: Date },
    password        : { type: String, select: false },
    username        : { type: String, required: true },
    points          : { type: Number},
    unlockedElements : [],
    combinationsTried : [[]]
});


// ================================================================================
// ============================ IMPLICIT DATABASE LOGIC ===========================
// ================================================================================


// Set .createdAt and .updatedAt attributes of User Schema
UserSchema.pre("save", function(next){
  let now = new Date();

  if ( !this.points ) {
    this.points = 0;
  }

  this.updatedAt = now;

  if ( !this.createdAt ) {
    this.createdAt = now;
  }

  // Hash password (salt)
  let user = this;

  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(user.password, salt, (err, hash) => {
      user.password = hash;
      next();
    });
  });
});

// Check if user-inputted password matches password in database
UserSchema.methods.comparePassword = function(password, done) {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    done(err, isMatch);
  });
};


// ================================================================================
// ================================ MODULAR EXPORT ================================
// ================================================================================


module.exports = mongoose.model("User", UserSchema);
