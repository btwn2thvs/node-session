'use strict';

var middleware = require('./middleware'),
    app = middleware.app,
    mongoose = require('mongoose'),
    User = require('./models/user').User,
    db;

// establish mongo connection  
mongoose.connect('mongodb://localhost/local');
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('disconnected', console.error.bind(console, 'Disconnected from Mongo'));
db.on('connected', console.log.bind(console, 'Mongo connection established'));

function authenticate(req, res, next) {
 if(req.session.user_id) {
    // Lookup the User information via the session
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        console.log("Authenticated user " + user.email + " by current session.");
        req.currentUser = user;
        next();
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.redirect('/login');
  }
}

app.get('/', function(req, res) {
  res.redirect('/login');
}); 

/*
 * Users
 */
app.get('/register', function(req, res) {
  res.render("users/register.ejs", {
    error: '',
    links: []
  });
});

app.post('/register', function(req, res) {
  var user = new User(req.body);
 
  user.save(function(err) {
    if(err) {
      if(err.name === "ValidationError") {
        res.locals.error = 'Email must not be empty.';
      } else if (err.message === "Invalid password") {
        res.locals.error = 'Invalid password.';
      } else if (err.name === "MongoError") {
        res.locals.error = 'Email ' + user.email + ' is already in use.';
      }
      console.warn("Error saving user: %s", err.stack);
      res.render("users/register.ejs");
    } else {
      req.session.user_id = user.id;
      res.redirect('/my_secret_page');
    }
  });
});

app.get('/login', function(req, res) {
  res.render('users/login.ejs', {
    error: ''
  });
});

app.post('/login', function (req, res) {
  User.login(req.body.email, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.locals.error = 'Authentication failed, please check your '
        + ' username and password.';
     
      res.render('users/login.ejs');
    } else {
      req.session.user_id = user.id;
      console.log(user.email + ' logged in successfully');      

      if(req.body.remember_me) {
        console.log("I will remember you!");
        req.session.cookie.maxAge = 2 * 24 * 60 * 60 * 1000;
      } 
      
      res.redirect('/my_secret_page');
    }
  });
});

app.get('/logout', authenticate, function(req, res) {
  if(req.session) {
    req.session.destroy(function() {
      res.redirect('/login');
    });
  } 
});

app.get('/my_secret_page', authenticate, function (req, res) {
  res.send('if you are viewing this page it means you are logged in');
});

// Start listening on the port
var port = process.env.PORT || 3000
app.listen(port, function() {
  console.log("Listening on " + port)
});
