#### 19/04/2016
# Authorized BeerList Project – Ziv Gilad

## Lesson Overview

*	Intro
*	Getting Started
*	UserModel.js – Client Side
*	UserModel.js – Server Side
*	Login and Registration Container and Templates
*	Server Side Authentication Strategies
*	Check Authentication in Existing Routes

## Intro
This project in extension to **beerList-server** project  and continues from where we left off.

In this lesson we're going to add authorization to our BeerList site.
We decided that it’s about time that our BeerList will become a commercial site.
However our project manager says that there’s ‘no way we’re going live without using some sort of authentication mechanism‘.
Finally we all decided to implement authentication as follows:

1.	Anyone can view the beers list, as there’s nothing secret about our beers.
2.	Only registered users will be able to add, update and remove beers from the list.
3.	For now we’ll allow anyone to register as users in our system. In the future we might want to restrict that.
From these requirements we, the developers, understand that we need a registration form, a login form, and a way to check whether access to the beer list is granted or prohibited.

## Getting started

We learned in the **Passport** lesson that we need to install the following:

Passport, of course:

```javascript
npm install passport –save
```

The express-session:

```javascript
npm install express-session –save
```

And passport-local:

```javascript
npm install passport-local --save
```

## UserModel.js – Client Side

Now that we need authentication, we need to add a Backbone model representing the user, and we’ll call it  **UserModel**:

```javascript
var UserModel = Backbone.Model.extend({
  idAttribute: '_id',

  defaults: {
    username: '',
    password: '',
	retypePassword: '',
	isRegisterNew: false
  },
  
  url: function(){
	console.log(this.get('isRegisterNew'))
	if (this.get('isRegisterNew')){
		return '/register';
		}
	else
		return '/login';
        },
		
  validate: function (attrs) {
  console.log(attrs.username)
        if (!attrs.username) {
            return 'Please fill username field.';
        }
        if (!attrs.password) {
            return 'Please fill password field.';
        }
		
	if (!attrs.retypePassword) {
            return 'Please fill retype password field.';
        }
		
	if (attrs.password !== attrs.retypePassword) {
            return 'Please make sure password and retype password are equal.';
        }
    }
}); 
```

### Note here two things:

1.	We use this model for both registering a new user and login en existing user (the isRegisterNew flag)
2.	We implemented a validate function. This function is called by Backbone prior to communication with the server, and if the validation fails, Backbone never sends a request to the server

## UserModel.js – Server Side
The server also needs a UserModel, which is a Mongoose model:

```javascript
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: {type: String},
  password: {type: String}
});

var User = mongoose.model("User", userSchema);

module.exports = User;
```

## Login and Registration Container and Templates

Add two container divs to the index.html for displaying the login and the register forms:

```javascript
<div id="login_container"></div>
<div id="register_container"></div>
```

Then add the two templates:

```javascript
<script id="login-template" type="text/x-handlebars-template">
<script id="register-template" type="text/x-handlebars-template">
```

**The templates are not provided; you’ll need to prepare them yourself.**

The login template should contain a username and password field,
The registration form should add the retype password fields.

## Server Side Authentication Strategies

Add two server side strategies:

One is called **“login”** which checks whether the user exists in the users collection.
The other is called **"register"** which saves the user into the database, if doesn’t exists already.

```javascript
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
```

#### Add appropriate login and registration post routes

## Check Authentication in Existing Routes

According to our requirements you should protect the existing routes:

```javascript
app.post('/beers', function (req, res, next) {
app.put('/beers/:id',  function(req, res, next) {
app.delete('/beers/:id', function (req, res) {
```

How do you check authentication?

```javascript
Just add this code to the beginning of the function:

```javascript
if (!req.isAuthenticated()){// denied.
		res.status(401);
        res.end();
        return;
	}
```

### We want to change a bit the app.post('/login'...

In the Passport lesson our `login` post route looked like this:

```javascript
app.post('/login', passport.authenticate('login', {
    successRedirect: '/success',
	failureRedirect: '/login'//,
}));
```

However in our case we do not want our server to redirect the client.
We want the server to return either status 401 (Unauthorized) or the logged in user.

Therefore we change our post route to be:

```javascript
app.post('/login',
  passport.authenticate('login'),
    function(req, res) {
        // Note that we do not use regirect in this example. Just return the user as json
        // If this function gets called, authentication was successful. 'req.user` contains the authenticated user.
        res.json(req.user);
    }
);
```

**We’re done with our server!**
Let’s get back back the client code

## Protection on the Client Side
How do we protect against unauthorized access on the client side?

**We need to modify both BeerView and AppView.**

Let’s start with AppView.

```javascript
We need to add another parmeter to createBeer:
{
wait : true,    // waits for server to respond with 200 before adding newly created model to collection
error : function(err) {
	alert("You're not authorized to add beers!");
}
```

**Let's explain that:**

We have to wait for the server’s approval before we add it to the view, so we use `wait : true` to make the call synchronous. Without this setting the view will just add the new beer without waiting for the server to reply, although the server might deny new beer.

The error callback just displays to the user that the server denies the new beer.

Now move to BeerView:
In BeerView we need to add a similar protection to both removeBeer and close which updates the beer after edit.

### Now it’s your turn.

After reading the explanation above, go ahead and implement authentication in your code. Good luck! 
 
