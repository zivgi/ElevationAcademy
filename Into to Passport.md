#### 16/04/2016
# Intro to Passport – Ziv Gilad

## Lesson Overview

*	Background
*	Installing Passport
*	Getting Started
*	Verify Callback
*	Sessions
*	Logout

## Background

We know by now how to set up a running webserver:
We use Node.js as our backend server, Express.js as our web server framework and MongoDB as our database.
But our server isn’t complemented. This is because we haven’t implemented any authentication and as you probably know, implementing some sort of robust authentication is a must.

**But what is authentication?**

Authentication is any process by which a system verifies the identity of a user who wishes to access it. Generally, a user has to enter or choose a login ID and provide his password to begin using a system.
Knowledge of the login credentials is assumed to guarantee that the user is authentic. 

**And how is it related to Passport?**

Here’s is what Passport is, from the http://passportjs.org/ site:

> “Passport is authentication middleware for `Node.js`. Extremely flexible and modular, Passport can be unobtrusively dropped in to any Express-based web application. A comprehensive set of strategies support authentication using a username and password, Facebook, Twitter, and more”

**Let’s first recall what a middleware is:**

A middleware is function that gets in the middle of the request-response pipeline and can alter the response.

By providing itself as a middleware, Passport makes it easy to separate the authentication code from the other concerns of the application.

The traditional way of authentication makes use of a local users database, containing all valid users with their encrypted passwords.
Modern web applications authenticate using your social media accounts (such as Facebook, Twitter and Google).

## Installing Passport

Let’s now install Passport.
Create a new folder named ‘Passport’, open a console window and navigate to this folder.
Install the Passport package using our familiar NPM command (verify it after running the command):

```javascript
npm install passport
```

Passport is an Express middleware; therefore we also need to install the Express package:

```javascript
npm install express
```

## Getting Started

Create a new file named `passport.js` with the following lines of code:

```javascript
var express = require('express');
var app = express();
var passport = require('passport');
```

For a start we’ll use the username and password authentication **strategy**.
Passport uses the term **strategies** to authenticate requests. The most familiar strategy is verifying using a username and a password.

This strategy is implemented in a separate `NPM` package named `passport-local`, so go ahead and install it:

```javascript
npm install passport-local
```
Require the strategy in the node script file:

```javascript
var LocalStrategy = require('passport-local').Strategy;
```

Now configure a local strategy named **‘login’** using `passport.use` command:

```javascript
passport.use('login', new LocalStrategy(
  function (username, password, done) {
    var authenticated = true;
	if (authenticated)
		return done(null, {myUser:'user', myID: 1234});
	else
		return done(null, false, { message: 'Incorrect username, for example' });
  }
));
```

The name ‘login’ is totally arbitrary. We chose this name because it’s a meaningful name for the purpose of login. Later in the Login route we’ll refer to this name.

The callback we pass as a second parameter is a **‘Verify Callback’** (see explanation below), and will be invoked by Passport, passing in the username and password fields, as were extracted from the `request.body` property which is expected to be populated with the posted data.
Ignore the content of the ‘Verify Callback’, as we’ll explain in later.

#### Let’s take care of populating the request.body property

We met the "body-parser" middleware in the full stack project and used it for exactly this purpose – populating `request.body` with posted data.

##### Let’s install it:

```javascript
npm install body-parser
```

And use it in our node script file:

```javascript
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
```

Note that in the full stack project we posted data using the JSON format, so we used `app.use(bodyParser.json());`. 
Here we’ll be using a login form (we’ll create it soon) and send the form data as url-enocoded, so we’re using  `bodyParser.urlencoded({ extended: false });`  

## Verify Callback

When Passport authenticates a request, it parses the credentials contained in the request and passes them as arguments to our ‘verify callback’ function.

It’s our responsibility to verify whether the user is authenticated.
This way the application is free to choose how user information is stored, without any assumptions imposed by the authentication layer.

If the credentials are valid, the verify callback should invoke the ‘done’ function, passing in the authenticated user:

```javascript
return done(null, user);
```

If the credentials are not valid (for example, if the password is incorrect), done should be invoked with false instead of a user to indicate an authentication failure. An additional info message can be supplied to indicate the reason for the failure.

```javascript
return done(null, false, { message: 'Incorrect login.' });
```

There’s a third option – an exception is raised while verifying the credentials.

When this happens (for example, if the database is not available), done should be invoked with an error as its first argument:

```javascript
return done(err);	
```

##### Note that it is important to distinguish the two failure cases that can occur:

1.	Authentication error, which is an expected failure. Therefore we do not supply the error argument to ‘done’. 
2.	Server exception, in which the err field is set with the error.

#### Let’s now see Passport in action.

Before we begin let’s recall the use of **middlewares**.
We saw the use of `app.use(…` for installing a middleware. 
This form installs a global (application level) middleware.
Another form is the route level middleware. In this form we set a middleware only for a specific route.

`passport.authenticate` is the middleware that extracts the username and password fields from the `request.body` and passes them to our verify callback.

This middleware is only applicable for the login ‘route’, where the user enters his credentials and the form posts its data to the login ‘route’.

Let’s add a login post route with `passport.authenticate` as the route level middleware.

A route lever middleware is passed as the second argument to the route configuration:

```javascript
app.post('/login', passport.authenticate('login', {
    successRedirect: '/success',
    failureRedirect: '/login',
    session: false
}));
```

This middleware is configured to use the ‘login’ strategy (recall that we configured a local strategy with the name ‘login’), to disable sessions (we’ll see what session means) and to redirect to either ‘success’ or ‘login’ routes, based on whether login has succeeded.

#### It’s time for our login form

### Exercise:

Create an html page named ‘login.html’ with a form that posts two fields to the url ‘http://localhost:1337/login’.
The fields should be named ‘username’ and ‘password’.

### Answer:

```javascript
<form action="http://localhost:1337/login" method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username"/>
    </div>
    <div>
        <label>Password:</label>
        <input type="password" name="password"/>
    </div>
    <div>
        <input type="submit" value="Log In"/>
    </div>
</form>
```

This form posts two fields, ‘username’ and ‘password’ to the ‘login’ route.

Note that by default, LocalStrategy expects to find credentials in parameters named username and password. If we had chosen different names for these fields we would have to configure LocalStorage with these names:

```javascript
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passwd'
  },
```

Let’s create the success' and login' get routes, as pointed out by the `passport.authenticate` configuration in the post login route:

```javascript
app.get('/success', function (request, response){
	response.send("Hey, hello from the server!");
})

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/login.html');
});
```

### Exercise:

Add the code to start the express web server on port 1337, and launch the file on node.
Then navigate to http://localhost:1337/login and try these three:
*	Set only username and press the login button
*	Set only password and press the login button
*	Set both username and password press the login button

What did you see?

### Answer:

Add at the end of the node script file:

`app.listen(1337);`

Then we navigate to http://localhost:1337/login through the url box and we see the following.
*	Username without password? Passport redirects back to the login page
*	Password without username? Passport redirects back to the login page
*	Both username and password? Passport redirects to the success route.

##### Congratulations! We managed to get `passport.authenticate` to work with our configured  successRedirect and failureRedirect!

### Exercise:

What would happen if we used a non-existing local strategy configuration name in the login post route?
For example:

```javascript
app.post('/login', passport.authenticate('login1'…
```

See for yourself.

### Answer:

This is what we get:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport_files/image001.png)

##### Ok then, we better use an existing name :-)

## Sessions

We learned how to protect the login post route against unauthorized access, and we definitely do not want to prompt the user for his credentials again and again, for every page that he visits.

This is where **sessions** come in.

We want to keep the login session, so the user only needs to login once and his credentials will be attacked to the session.
After successful authentication, Passport will establish a persistent login session.

Of course we’ll have to add a logoff feature, so the user can end his session whenever he wants, we’ll get to it later on.
 
First, let’s start with removing the line in the `passport.authenticate` configuration (because the default is to use sessions):

```javascript
session: false
```

When we try to login with a username and password, we get the following error:

```javascript
Error: Failed to serialize user into session
```

This happens because Passport doesn’t know what we want to store in the session.

We might want to store the user id, the user name. It’s totally up to us.

Therefore Passport expects us to supply a `serializeUser` callback function.
Passport invokes this function when leaving the ‘verify callback’ with the user parameter that we supplied to its done function.

Remember that we wrote:
```javascript
return done(null, {myUser:'user', myID: 1234});
```
Password will now call us with this exact same user.

### Exercise:

Add the following code to your node file, then launch it and make sure the previous error is gone.  What do you see in the note’s console?
```javascript
passport.serializeUser(function (user, done) {
   console.log(user);
   done(null, user);	// Could store just the id using done(null, user.id);
});
```

### Answer:

```javascript
{ myUser: 'user', myID: 1234 }
```
You see? We got the exact same user.

Passport asked us to serialize the user but it can’t do anything with this data yet, because me need to complete two more steps:
1.	Enable sessions in express. This is done using a new package named `‘express-sessions’`.
Let's install it:
```javascript
npm install express-sessions
```

Then install it as a middleware and configure its secret key:

```javascript
var expressSession = require('express-session');
app.use(expressSession({secret: 'mySecretKey'}));
```

You probably ask yourself what is this **secret key**?
Well, express-session middleware saves the session id in a cookie, and the session itself in the server’s memory.

This is **not good for production** but for debugging and developing it’s good enough.

The secret is used to sign the session ID cookie, so the server can validate it.

2.	Install passport’s session middleware by adding to you code:

```javascript
app.use(passport.session());
```

When we launch node and login, we see the following error:
Error: Failed to deserialize user out of session

Now that sessions are finally working, passport asks us to deserialize the data that he kept on the session into a user object.

For example, we could have stored the user id in the session and then read the user from the MongoDB database using this id.
Passport then takes this object and sets it to a property named ‘user’ on the request object.

Add the following code:
```javascript
passport.deserializeUser(function (user, done) {
    done(null, user);	// If we stored just the id, we could call User.findById(id, function(err, user)
});
```

And log request.user in the success get route:
```javascript
app.get('/success', function (request, response){
	console.log(request.user);
 ```

##### What do we get now?
We see that the error is gone, and we can see the user on node’s console:
```javascript
{ myUser: 'user', myID: 1234 }
```

Note that when navigation to success route directly without going through the login page, the console.log prints ‘**undefined**’.

This is great; because we now have a way to protect any route we want without forcing the user to reenter his credentials:
We can check whether user object exists.

Actually the passport code defines a function on the request object named `‘isAuthenticated()’` which does just that.

Let’s alter the success get route to handle unauthorized access:

```javascript
app.get('/success', function (request, response){
	if (!request.isAuthenticated())// Denied. Redirect to login
		response.redirect('/login');
	else
		response.send("Hey, hello from the server!");
}) 
```

Check it out. Launch node, then navigate to ‘success’ route. See the login-page redirection? Now enter your credentials and retry.
Refresh the browser few times. See that there’s no login page? We are still authorized!

## Logout
We previously mentioned that the user must have a way to logout himself whenever he likes to.
Actually this is just a matter of calling the `logout` function of the request object.

Let’s add a ‘logout’ route for this purpose:

```javascript
app.get('/logout', function(req, res) {
    req.logout();
    res.send("Logged out!");
});
```

Now launch node add see that the logout works:

- Navigate the success route – the login form is displayed
- Enter credentials – the success page is displayed.
- Refresh the browser few times – the success page is still displayed.
- Navigate to the logout route – See the message ‘Logged out!’
- Navigate to the success route – the login form is displayed

### Final Exercise

The verify callback we developed authenticates all users.

Modify the verify callback in a way that only a user with your name and password equals to your last name will be authenticated.

### Answer:

```javascript
passport.use('login', new LocalStrategy(
  function (username, password, done) {
	var authenticated = username === "John" && password === "Smith";
	if (authenticated)
		return done(null, {myUser:'user', myID: 1234});
	else
		return done(null, false, { message: 'Incorrect username, for example' });		
}
));
```

### Done! We now know how to authenticate users with username and password and to protect any route we want! We’ve just added the missing authentication to our server!
