#### 04/05/2016
# Intro to Passport – Facebook by Ziv Gilad

## Lesson Overview
* Introduction
* Social Login
* Register an Application with Facebook
* Getting Started
* Passport Facebook Configuration
* Login with Facebook
* Requesting Additional Permissions

## Introduction

The `Passport-Facebook` is an `NPM` module which implements a `Passport` strategy for authenticating  with Facebook.

Recall that in our Passport lesson we used the `passport-local` strategy, for authenticating our routes with usernames and passwords.

With the `passport-local` strategy we had to manage the passwords ourselves. In our `BeerList` project, for example, we decided to store them in the `MondoDB` database.

In the `crypto` lesson we learned that we must encrypt the passwords before saving them into the database (when we store a user's password we are responsible for securing it).

We usually have to work very hard to convince our users that their details are secured and gain their trust.

**That’s quite a big burden.**

A different approach is to use what is called a `social-login`.

## Social Login

From Wikipedia:

> Social login, also known as social sign-in, is a form of single sign-on using existing login information from a social networking service such as Facebook, Twitter or Google+ to sign into a third party website instead of creating a new login account specifically for that website. It is designed to simplify logins for end users as well as provide more and more reliable demographic information to web developers.

Social login allow users to authenticate using their existing social media identities and pre-verified user accounts.

It also provides permission-based access to users’ data, so it can be used as a mechanism not only for authentication but also for authorization.

The `passport-facebook` is therefore a strategy that allows our users to authenticate with their Facebook account.
If we can do that we won’t need to maintain and secure the login mechanism ourselves.

No need to convince our users that their details are safe either, because no one will send us any passwords.

We will redirect our users to Facebook’s login page, and Facebook validate the user's credentials and will send us an access token.

## Register an Application with Facebook

Before using `passport-facebook`, you must register an application with Facebook.

For this, go to the Facebook Developers site at https://developers.facebook.com/.

Enter your Facebook credentials. Then click the **Register** button to Register as a Facebook Developer, and accept the policy.

Next you will need to supply your phone to receive a confirmation code:

![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image001.png)
 
Go ahead, enter your phone, click the **Send as Text** and register with the confirmation code you receive.

You should then see the following message:

```javascript
You have successfully registered as a Facebook Developer.
You can now add Facebook into your app or website.
```

### Congratulations! You are now registered as a Facebook developer!

Facebook redirects to the quickstarts page (https://developers.facebook.com/quickstarts/) and asks you to select a platform to get started.

Click the **Website** option and Facebook will display the following message:
 
![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image002.jpg)

Click the **Skip and Create App ID**, and Facbook will display the **Create a New App ID** form.

Fill in the details:

![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image003.jpg)
 
You can see the name that I’ve chosen for my app.
Enter your email and select a category (doesn’t matter which one) and click the **Create App ID** button.

Facebook then displays a **Security Check** form just to make sure that a real human sits in front of him, and redirects you to the developer dashboard.

![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image004.jpg)   

You can see that Facebook has just issued an app ID and app secret (click on **Show** to see the secret key) for your new application. These two values will be provided to the `passport-facebook` strategy (we'll soon see).

#### Now it’s time for some node script.

## Getting Started

Let's install Passport:

```javascript
npm install passport
```

Passport-Facebook:

```javascript
npm install passport-facebook
```

And express:

```javascript
npm install express
```

Then create a new node script file and requite those packages:

```javascript
var express = require('express');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
```

Note the similarity to the `passport-local` strategy where we used:

```javascript
var LocalStrategy = require('passport-local').Strategy;
```

## Passport Facebook Configuration

We configure the passport facebook strategy quite similar to the way we configured the local strategy:

```javascript
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("accessToken:");
    console.log(accessToken);
	
	console.log("refreshToken:");
    console.log(refreshToken);
	
	console.log("profile:");
    console.log(profile);
	return done(null, profile.id);
  }
));
```

We first pass some options:
* The app ID (mine is '1685471645046548' as you can see in the image above).
* The secret obtained when creating the application.
* A callbackURL (we'll soon see its meaning).

After the configuration options we set a `verify callback` function (if you don’t remember what a verify function is, reopen your Passport lesson).
 
Recall that in the Password lesson, the verify callback was in the format of:

```javascript
function (username, password, done) {
```

With Facebook strategy the verify callback looks a bit different:

```javascript
function(accessToken, refreshToken, profile, done)
 ```

This verify callback receives the access token, an optional refresh token and the profile which contains the authenticated user's Facebook profile.
We **DO NOT** get any access to the user's password! That's an important point because we do not want to be responsible for securing it! 

As with the local strategy, we need to call `done` to complete the authentication process.
 
Add the following code to your node script:

```javascript
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/facebookCanceled', session: false }),
  function(req, res) {
	res.send("You pressed OK");
  });

app.get('/facebookCanceled', function(req, res) {
    res.send("You canceled!");
```

We need to set one more configuration in the Facebook for developers site before we can test our route:

Select the **settings** tab and in the settings tab, click the **Advanced** tab and look for the **Valid OAuth redirect URIs** field.

Set its value to our redirect url:
http://localhost:1337/auth/facebook/callback

![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image005.png)
 
Now that Facebook knows that it’s a valid redirect url for our application, we can navigate to our route.

## Login with Facebook

Let’s finalize the node script first by adding these lines:

```javascript
app.use(passport.initialize());
app.listen(1337);
```

Launch node and navigate to the following url:

```javascript
localhost:1337/auth/facebook
```

What do you see?
`passport-facebook` redirects the url to the Facebook site, and this is what my Facebook displays: 
 
![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image006.png)

I see this message because I previously logged into Facebook. Otherwise Facebook displays the Log into Facebook form prior to displaing the message you see above.

See? Our node script has nothing to do with any username and password. It’s all Facebook!

Now, as the user of the `passport-facebook` node script site I’m getting a choice:

I can either tell Facebook that I agree to send my profile back to the `passport-facebook` node script, or that I regret and do not want to share my profile with the application.

#### Let’s check both options:

Click the **Cancel** button. What do you see?
The page was redirected to the `facebookCanceled` route and we see the message:

```javascript
You canceled!
```

Let’s check the other button - the **Okay** button.

In the browser we now see the message:

```javascript
You pressed OK
```

And in the node console we see our logs:

```javascript
accessToken:
EAAX87XKulxQBAPrOZCac8oV201V2rjIEZAJ574LRv1ZCYQcr7tKokFjU
N1HznQlCimIRZBj5Q8ZBydxfnE3IZD
refreshToken:
undefined
profile:
{ id: MY_USER_ID,
  username: undefined,
  displayName: MY NAME,
  name:
   { familyName: undefined,
     givenName: undefined,
     middleName: undefined },
  gender: undefined,
  profileUrl: undefined,
  provider: 'facebook',
```

I replaced my id and name from this document, as you can see.
you should see your id which is a long number and your Facebook name.

##### That’s great – we can see the user profile. Facebook has just redirected to our callback url, passing in the access token and the user profile to our verify callback.
 
#### Our users can now login to our site with their Facebook account!

## Requesting Additional Permissions

What if want to access our users' friends list?
The permissions we got from the user are quite limited – just his public profile.
We have no access to any of his friends. How can we grant more access?

For this we need to ask our user for **additional permissions**.

From the `passport-facebook` site:

> If you need additional permissions from the user, the permissions can be requested via the scope option to passport.authenticate().
> `app.get('/auth/facebook',`
   `passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));`

>Refer to permissions with Facebook Login for further details (https://developers.facebook.com/docs/facebook-login/permissions).

We see that we can ask Facebook for more permissions, and multiple permissions can be specified as an array.

Let’s try that out.

Update our route code to be:

```javascript
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['user_friends'] }));
```

Navigate once more to 

```javascript
localhost:1337/auth/facebook.
```

What do you see?
Facebook asks us to approve the new permissions:

![](http://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Into%20to%20Passport-Facebook_files/image007.png)


It doesn’t matter if we press the **Not Now** or **Okay** buttons, we still see the  message:

```javascript
You pressed OK
```

This is because the user is logged in, no matter which button is pressed.

It only matters when the application tries to access the user’s friends, which it definetly fail if the user chose the **Not Now** option.

However accessing the user friends is behind the scope for this lesson.

That’s it.
#### We now can integrate the passport-facebook strategy in our BeerList project, so our users can register with their Facebook account.

#### We do not need maintain and secure a local users database anymore!
   
