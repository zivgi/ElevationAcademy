#### 02/05/2016
# Intro to Node Crypto Module – Ziv Gilad

## Lesson Overview
* Introduction
* Getting Started
* Getting Crypto into the Picture
* Hashes

## Introduction
The crypto module, is a built in node module (comes with node installation) which provides cryptographic functionality.

### What is 'cryptography'?
From Wikipedia:

> cryptography referred almost exclusively to encryption, which is the process of converting ordinary information (called plain text) into unintelligible text (called cipher text). Decryption is the reverse, in other words, moving from the unintelligible cipher text back to plain text.

Under the hood this module uses `OpenSSL` which is an open source general-purpose cryptography library (we won't get into OpenSSL in this lesson).

## Why do we need encryption?

Recall that in our `Passport` lesson we used the `passport-local` strategy, for authenticating our routes with usernames and passwords.

Then in our **BeerList with Mongoose and Passport** project we used the `Mongoose` database to store the registered users together with their passwords.

How did we store these passwords in the database?
We stored them as plain (unprotected) text!

**In real life we never store passwords as plain text!**

Why is that?

The minute we store a user's password, we are responsible for securing it.

Let's say the database was accidentally exposed to the public web. Doesn't matter how. It just happened.
Once a hacker has the database in his hands, **he has everyone's passwords** as well.

## Getting Started

As a first step, create a new folder named `crypto`, open command prompt and navigate to this folder. Then install the following packages:

```javascript
npm install passport
npm install express
npm install mongoose
npm install passport-local
npm install body-parser
```

Next, create a node script file named `crypto.js` and add all familiar requires:

```javascript
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
```

Add a Mongoose model named `User`:

```javascript
var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: {type: String},
  password: {type: String}
});
var User = mongoose.model("User", userSchema);
```

Add two html pages, one for login form (`login.html`) and one for the registration form (`register.html`):

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

And

```javascript
<form action="http://localhost:1337/register" method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username"/>
    </div>
    <div>
        <label>Password:</label>
        <input type="password" name="password"/>
    </div>
    <div>
        <input type="submit" value="Register"/>
    </div>
</form>
```

Add the node script code to support these routes as well as writing/reading users from the Mongoose database:

```javascript
mongoose.connect('mongodb://localhost/users');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.listen(1337);
```

```javascript
passport.use('login', new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username, password: password }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
		return done(null, 
				_id: user._id,
                username: user.username
            }
		);
    });
}));

passport.use('register', new LocalStrategy({},
  function (username, password, done) {
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
            // create the user
            var newUser = new User();  
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

```javascript
app.post('/login', passport.authenticate('login', {
    successRedirect: '/loginSuccess',
	failureRedirect: '/loginFailed',
    session: false
}));

app.post('/register', passport.authenticate('register', {
    successRedirect: '/registerSuccess',
	failureRedirect: '/registerFailed',
    session: false
}));

app.get('/loginSuccess', function(req, res) {
    res.send("Login Success!");
});
app.get('/loginFailed', function(req, res) {
    res.send("Login Failed!");
});
app.get('/registerSuccess', function(req, res) {
    res.send("Register Success!");
});
app.get('/registerFailed', function(req, res) {
    res.send("Register Failed!");
});
```

So far we haven’t seen anything new, we’ve already gone throut this code in previous lessons.

### Let’s test the login and registration forms.

Launch node with the script file, then register a new user.
Open the login page and enter the wrong credentials.
You should see in your browser:

```javascript
Register Failed!
```

Now enter the correct credentials. You should now see in your browser:

```javascript
Register Success!
```

Go to the `MongoDB` console and check the users collection:

```javascript
db.users.find();
{ "_id" : ObjectId("572742ea69c60d0434121442"), "password" : "David123", "username" : "David", "__v" : 0 }
```

**That’s a huge problem!**

I haven’t told you anything about the user that I’ve picked for testing the system, however you can clearly see his password.

This is a big **NO** – We’ve already stated that passwords should never be stored as plain text in the database.

This is where the `crypto` module comes into the picture.
Let’s see how we can use `crypto` to fix this problem.

## Getting Crypto into the Picture

Let’s start with requiring `crypto`:

```javascript
var crypto = require('crypto');
```

### Encoding and decoding messages
Next we want to encode our passwords (this is called ciphering) and decode it back (this is called deciphering).

For these, Crypto comes with the following two methods:

```javascript
crypto.createCypher(algorithm, key)
```
```javascript
crypto.createDecipher(algorithm, key)
```

The key is used as a password (we'll see an example soon) and the algorithm is one of the supported `OpenSSL` cipher-algorithms. We won’t get into that, but a good and popular one is `AES192` (AES stands for Advanced Encryption Standard).

Let’s add the code to create the cipher:

```javascript
var cipher = crypto.createCipher("aes192a", "myPassword");
```

#### Question:

What happens if we use a non-existing cipher-algorithm?
Check that out.

#### Answer:

If we use, for example, algorithm named `aes192abc`, an error is thrown with the description:

```javascript
Error: Unknown cipher
```

To produce the encrypted data we need to invoke two functions on the cipher object:

`update` and `final`.

We invoke the `update` function with the data that we want to encrypt, the encoding of the data (can be `utf8`, `ascii`, or `binary`) and the format of the enciphered output (`binary`, `base64` or `hex`).

The `update` function is designed to be called multiple times with new data (this is good for streaming) and when there’s no data left to be encrypted, we should call `cipher.final()`, passing in the required output format (again, this can be `binary`, `base64` or `hex`).
 
Once the `cipher.final()` method has been called, the `Cipher` object can no longer be used to encrypt data

Let’s see the encryption in action.

Add the following code to your script node for to encrypting 
our password:

```javascript
var text = "David123";
var crypted = cipher.update(text,'utf8','hex');
crypted += cipher.final('hex');
console.log(crypted);
```

On the node console we see get:

```javascript
ea2a3bd94870c32e36ebf7a4194e760d
```

From this hex code we definitely cannot figure out that I used the password "**David123**"! That’s good.

How do we decipher this hex number and get the plain text out of it?
If we know the cipher algorithm and the password encryption key, we can use the decipher class to decrypt the data:

```javascript
var decipher = crypto.createDecipher(algorithm,password)
var dec = decipher.update(text,'hex','utf8')
dec += decipher.final('utf8');
```

The decipher’s `update` and `final` functions and very similar to the cipher ones with one major difference – everything is reversed.
This means that the input encoding is `binary`, `base64`, or `hex` and the output format is `binary`, `ascii` or `utf8`.

As with the cipher class, the `decipher.update()` method can be called multiple times with new data until `decipher.final()` is called

Let’s add that to our code:

```javascript
var decipher = crypto.createDecipher("aes192", "myPassword")
var dec = decipher.update(crypted,'hex','utf8')
dec += decipher.final('utf8');
console.log(dec);
```

What do we see on our console?
We see:

```javascript
‘David123’
```
#### Exercise:
Change the registration local strategy to save the encrypted password to the database.

#### Answer:

Change

```javascript
newUser.password = password;
```

To be:

```javascript
var cipher = crypto.createCipher("aes192", "myPassword");
var crypted = cipher.update(password,'utf8','hex');
crypted += cipher.final('hex');
newUser.password = crypted;
```

Let’s check:
```javascript
db.users.find();
"_id" : ObjectId("57276433e24a2bd871185bdd"), "password" : "ea2a3bd94870c32e36ebf7a4194e760d", "username" : "David", "__v" : 0 }
```

#### Exercise:

Update the counterpart `login` strategy to support encrypted passwords from the database.

#### Answer:

Change

```javascript
User.findOne({ username: username, password: password }, function (err, user){
```

To be:

```javascript
User.findOne({ username: username}, function (err, user) {
```

Add add:

```javascript
var decipher = crypto.createDecipher("aes192", "myPassword")
var dec = decipher.update(user.password,'hex','utf8')
dec += decipher.final('utf8');
		if (password !== dec)
			{ return done(null, false); }
```

When we check that out, we can see that it’s working.

That’s good. We can store the encrypted password `(ea2a3bd94870c32e36ebf7a4194e760d)` in Mongoose so if the database is stolen, no harm is done.

Then when a user tries to login with his password, we can decipher the encrypted database password and compare the deciphered password with the one passed to the login form.  

**That’s good, but far from being perfect!**

Why is that? 

What if the hacker gets an access to our node script? What if he has some inside information? Or even an existing employee in our company?
He can definatly see that our protecting password is `myPassword`.
 
We found another vulnerability in our site – our password “myPassword” is stored in our node script and is weakening the security of our web site, putting our users at risk.

How can we do better?

Let’s introduce hashes!

## Hashes

What is a hash?

A hash (also called a hash digest) is a fixed-length string that is deterministically generated from the  source data.

By **fixed length** we mean that the length of the hash stays the same, no matter whether the source is short (few bytes) or long (mega bytes).

By **deterministic** we mean that for the same input we always get the same hash value. This is because the hash function is deterministic and calculates the same result for the same input source data.

**Note**: A good hash algorithm is easy to apply, but hard to undo. Therefore if we hold a hash in our hand, it’s impossible to find out what the original source was.
**Also note** that a good hash algorithm is designed in such a way that different sources produce different hash values. It is extremely  unlikely to get the same hash for different sources.

#### Example for known hash algorithms:

**md5** – message-digest algorithm  - widely used cryptographic hash function producing a 128-bit (16-byte) hash value, typically expressed in text format as a 32-digit hexadecimal number.

**SHA-1** -  (Secure Hash Algorithm 1) a cryptographic hash function designed by the United States National Security Agency produces a 160-bit (20-byte) hash value,  typically rendered as a hexadecimal number, 40 digits long.

Let’s add some code to our node script. First, we create a hash:

```javascript
var hash = crypto.createHash("md5");
```

What if we use a non-existing hash algorithm name:

```javascript
var hash = crypto.createHash("md6");
```

An exception is raised with the description:

```javascript
Error: Digest method not supported
```

Similar to the cipher and decipher, we need to call `hash.update()` one or more times, passing in the data and the input encoding (`utf8`, `ascii` or `binary`).

When we’re done we need to call `hash.digest()` passing in the output format (`hex`, `binary` or `base64`).

The Hash object can not be used again after `hash.digest()` method has been called.

Let’s add more code to our file:

```javascript
hash.update("David123", 'utf8');
var hexHash = hash.digest("hex");
console.log(hexHash);
```

What do we see in the log:

```javascript
ea2a3bd94870c32e36ebf7a4194e760d
```

This is the hex representation of the hash, and it’s at the fixed length of 32 digits, because this is the way it is with the `md5` hash algorithm.

What do we need this hash for? How can it help us?
What is the reverse function? How can we get back our plain text-password?

**We can’t!** And that’s the whole idea behind hashes.  

Because hashes are both unidirectional (easy to apply, but hard to undo) and designed in such a way that different sources produce different hash values, we do not compare plain text passwords. We compare hashes!

The user’s password isn’t saved in a reversible manner. We save the hash, and therefore a stolen databases or stolen source files won’t do any help – **there’s no way to reproduce the user’s password**.

#### Final Exercise:

Update the login and register strategies to support hashes. 

#### Answer:

In the registration strategy add the following code:

```javascript
var hash = crypto.createHash("md5");
hash.update(password, 'utf8');
var hexHash = hash.digest("hex");
newUser.password = hexHash;
```

Let’s check:

```javascript
> db.users.find();
{ "_id" : ObjectId("5727698083750d0419ee8194"), "password" : "38ad33e2fc083c2843f12f8c6bb6b092", "username" : "David", "__v" : 0 }
```

And we can see our 32 digits hex numbers.

In the login strategy we first hash the password passed to the form and compare it with the hash value stored in the database:

```javascript
var hash = crypto.createHash("md5");
hash.update(password, 'utf8');
var hexPassword = hash.digest("hex");
		
if (hexPassword !== user.password)
	{ return done(null, false); }
```

### And we’re done!
#### Our site is now protected. No one can still our user’s passwords!
