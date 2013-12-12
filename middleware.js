var express = require('express'),
    app = express(),
    stylus = require('stylus'),
    mongoStore = require('connect-mongodb')
    path = require('path');

app.use(express.logger());

/**
 * Sets the directory containing views
 */
app.set('views', path.join(__dirname, '/views'));

/**
 * Allow PUTS and DELETES to be used for basic CRUD 
 * like implementation
 */
app.use(express.methodOverride());

app.use(express.json());
app.use(express.urlencoded());

/*
 * Middleware used to parse the Cookie header field
 * and populates req.cookes with object keys
 */
app.use(express.cookieParser());

/*
 * Middleware providing cookie session handling. 
 * Sessions are stored in Mongo in the db specified by
 * 'session-db-uri'
 */
app.use(
  express.session({
    store: mongoStore(app.set('mongodb://localhost/local')),
    secret: "test secret",
    maxAge: 3600000 // one hour
  })
);

/*
 * Stylus middleware provides CSS-preprocessing.
 */
app.use(stylus.middleware({ src: path.join(__dirname, 'public') }));

/*
 * Serving static files 
 */
app.use(express.static(__dirname + '/public'));

/*
 * Error handling middleware. This should typically
 * be the last called middleware as a catch-all.
 */
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Something broke!');
});

exports.app = app;
