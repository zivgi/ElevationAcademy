var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

mongoose.connect('mongodb://localhost/beers');

var Beer = require("./BeerModel");

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static('public'));
app.use(express.static('node_modules'));

//------------------------
// For authentication:
var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({ secret: 'mySecretKey' }));

app.use(passport.initialize());
app.use(passport.session());
//------------------------

app.get('/beers', function (req, res) {
  Beer.find(function (error, beers) {
    res.send(beers);
  });
});

app.post('/beers', function (req, res, next) {
    if (!req.isAuthenticated()) {// Protect route
        res.status(401);
        res.end();
        return;
    }
  var beer = new Beer(req.body);

  var body = [];

  req.on('data', function(chunk) {
    body.push(chunk);
  });

  console.log(body);

  beer.save(function(err, beer) {
    if (err) { return next(err); }

    res.json(beer);
  });
});

app.put('/beers/:id',  function(req, res, next) {
	if (!req.isAuthenticated()){// Protect route
		res.status(401);
        res.end();
        return;
	}
  Beer.findById(req.params.id, function (error, beer) {
    beer.name = req.body.name;

    beer.save(function(err, beer) {
      if (err) { return next(err); } 

      res.json(beer);
    });
  });
});

app.delete('/beers/:id', function (req, res) {
	if (!req.isAuthenticated()){// Protect route
		res.status(401);
        res.end();
        return;
	}
  Beer.findById(req.params.id, function (error, beer) {
    if (error) {
      res.status(500);
      res.send(error);
    } else {
      beer.remove();
      res.status(204);
      res.end();
    }
  });
});

//------------------------
// For authentication - Cont. Handle UserModel:

var User = require("./UserModel");

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.get('/checkIfAuthenticated', function (req, res) {
  
    res.send("aa");
});

var LocalStrategy = require('passport-local').Strategy;
passport.use('login', new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username, password: password }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
		return done(null, {
				_id: user._id,
                username: user.username
            }
		);
    });
}));

app.post('/login',
  passport.authenticate('login'),
    function(req, res) {
        // Note that we do not use regirect in this example. Just return the user as json
        // If this function gets called, authentication was successful. 'req.user` contains the authenticated user.
        res.json(req.user);
    }
);

passport.use('register', new LocalStrategy({
    passReqToCallback : true
  },
  function (req, username, password, done) {
    // find a user in Mongo with provided username
    User.findOne({ 'username': username }, function (err, user) {
        // In case of any error return
        if (err) {
            console.log('Error in SignUp: ' + err);
            return done(err);
        }
        // already exists
        if (user) {
            console.log('User already exists');
            return done(null, false);
        } else {
            // if there is no user with that email
            // create the user
            var newUser = new User();
            // set the user's local credentials
            newUser.username = username;
            newUser.password = password;    // Note: Should create a hash out of this plain password!
                
            // save the user
            newUser.save(function (err) {
                if (err) {
                    console.log('Error in Saving user: ' + err);
                    throw err;
                }
                console.log('User Registration succesful');
                return done(null, {
                    _id: newUser._id,
                    username: newUser.username
                    }
                );
            });
        }
    });
 }));

app.post('/register',
  passport.authenticate('register'),
    function (req, res) {
    // Return the new user
    res.json(req.user);
}
);

//------------------------
app.listen(/1337);
console.log("Started!")