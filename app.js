var middleware = require('./middleware'),
    app = middleware.app,
    mongoose = require('mongoose'),
    models = require('./models'),
    User = models.User,
    Token = models.Token,
    db = mongoose.connect('mongodb://localhost/local');

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.send('You are not authorized to view this page');
  } else {
    next();
  }
}

// Establish a session by the browser cookies
function authenticateToken(req, res, next) {
  var cookie = JSON.parse(req.cookies.token),
      tokenJson = { email: cookie.email,
                series: cookie.series,
                token: cookie.token };

  Token.findOne(tokenJson, function(err, token) {
    if (!token) {
      res.redirect('/login');
      return;
    }

    // Lookup the User information via the token
    User.findOne({ email: token.email }, function(err, user) {
      if (user) {
        req.session.user_id = user.id;
        req.currentUser = user;

        token.save(function() {
          res.cookie('token', 
                     token.cookieValue, 
                     { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          
          console.log("Authenticated user " + user.email + " by browser cookies.");
          next();
        });
      } else {
        res.redirect('/login');
      }
    });
  });
}

function authenticate(req, res, next) {
  if(req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        console.log("Authenticated user " + user.email + " by current session.");
        req.currentUser = user;
        next();
      } else {
        res.redirect('/login');
      }
    });
  } else if (req.cookies.token) {
    authenticateToken(req, res, next);
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
    error: ''
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
  User.findOne({ email: req.body.email }, function(err, user) {
    if (user && user.authenticate(req.body.password)) {
      req.session.user_id = user.id;

      // Setup a cookie token
      if (req.body.remember_me) {
        var token = new Token({ email: user.email });
        token.save(function() {
          res.cookie('token', 
                     token.cookieValue, 
                     { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          res.redirect('/my_secret_page');
        });
      } else {
        res.redirect('/my_secret_page'); 
      }
    } else {
      res.locals.error = 'Authentication failed, please check your '
        + ' username and password.'
      res.render('users/login.ejs');
    }
  });
});

app.get('/logout', function(req, res) {
  //TODO kill cookies
  // destroy the user's session
  delete  req.session.user_id;
  res.redirect('/login');
});

app.get('/my_secret_page', authenticate, function (req, res) {
  res.send('if you are viewing this page it means you are logged in');
});

// Start listening on the port
var port = process.env.PORT || 3000
app.listen(port, function() {
  console.log("Listening on " + port)
});
