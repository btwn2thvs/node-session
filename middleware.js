'use strict';

var express = require('express'),
    stylus = require('stylus'),
    path = require('path');

var app = module.exports.app = express();

app.use(express.logger());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

app.use(express.methodOverride());

app.use(express.json());
app.use(express.urlencoded());

app.use(express.cookieParser('test secret'));
app.use(express.cookieSession());

app.use(stylus.middleware({ src: path.join(__dirname, 'public') }));
app.use(express.static(__dirname + '/public'));

/*
 * Error handling middleware. This should typically
 * be the last called middleware as a catch-all.
 */
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Something broke!');
});
