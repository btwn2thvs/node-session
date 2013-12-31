'use strict';

var mongoose = require('mongoose'),
    crypto = require('crypto');

var UserSchema = mongoose.Schema({
  'email': {
    type: String,
    index: { unique: true }
  },
  'hashed_password': String,
  'salt': String
});

// Validates the existence of an email address
UserSchema.path('email').validate(function (value) {
  return value && value.length;
}, 'An email is required');

// Adds id to the User object
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Adds password to the User object
// and defines how it will be saved to the db
UserSchema.virtual('password')
.set(function(password) {
  this._password = password;
  this.salt = Math.round((new Date().valueOf() * Math.random())) + '';
})
.get(function() {
  return this._password;
});

// Performs a user login
UserSchema.statics.login = function(email, password, fn) {
  User.findOne({ email: email }, function(err, user) {
    if(err || !user) {
      console.log("Unable to find User for email: " + email);
      return fn(new Error('Unable to find user'), user);
    }    

    if( password && password.length ) {
      var hashed_password = crypto.createHmac('sha1', user.salt).update(password).digest('hex');
      if (hashed_password === user.hashed_password) {
        return fn(err, user);
      }
    } 
      
    fn(new Error('Invalid password'), user);
  });
}

UserSchema.post('save', function(doc) {
  console.log('%s has been saved', doc._id);
});

var User = exports.User = mongoose.model('User', UserSchema);
