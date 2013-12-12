var mongoose = require('mongoose'),
    crypto = require('crypto'),
    Schema = mongoose.Schema, 
    ObjectId = Schema.ObjectId;

/**
 * Model: User
 */
function validatePresenceOf(value) {
  return value && value.length;
}

var UserSchema = new Schema({
  'email': { 
    type: String, 
    validate: [validatePresenceOf, 'an email is required'], 
    index: { unique: true } 
  },
  'hashed_password': String,
  'salt': String
});

UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

UserSchema.virtual('password')
.set(function(password) {
  this._password = password;
  this.salt = this.makeSalt()
})
.get(function() { 
  return this._password; 
});

UserSchema.method('authenticate', function(plainText) {
  return this.encryptPassword(plainText) === this.hashed_password;
});
  
UserSchema.method('makeSalt', function() {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

UserSchema.method('encryptPassword', function(password) {
  return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
});

UserSchema.pre('save', function(next) {
  if (!validatePresenceOf(this.password)) {
    next(new Error('Invalid password'));
  } else {
    next();
  }
});

UserSchema.post('save', function(doc) {
  console.log('%s has been saved', doc._id);
});

/**
 * Model: Cookie Tokens
 */

var TokenSchema = new Schema({
  email: {type: String, index: true},
  series: {type: String, index: true},
  token: {type: String, index: true},
});

TokenSchema.method('randomToken', function(next) {
  return Math.round((new Date().valueOf() * Math.random())) + '';
});

TokenSchema.pre('save', function(next) {
  this.token = this.randomToken();
  if (this.isNew) {
    this.series = this.randomToken();
  }
  next();
});

TokenSchema
.virtual('id')
.get(function() {
  return this._id.toHexString();
});

TokenSchema
.virtual('cookieValue')
.get(function() {
  return JSON.stringify({ email: this.email, token: this.token, series: this.series });
});

exports.Token = mongoose.model('Token', TokenSchema);
exports.User = mongoose.model('User', UserSchema);
