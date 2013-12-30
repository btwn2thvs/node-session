'use strict';

var mongoose = require('mongoose');

var TokenSchema = mongoose.Schema({
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

TokenSchema.statics.saveToken = function(res, token, fn) {
  token.save(function() {
    res.cookie(
      'token', 
      token.cookieValue,
      { expires: new Date(Date.now() + 2 * 604800000), path: '/', httpOnly: true, secure: true }
    );
    fn();
  });
}

var Token = exports.Token = mongoose.model('Token', TokenSchema);
