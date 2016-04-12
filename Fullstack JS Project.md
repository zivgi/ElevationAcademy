#### 07/04/2016
# Fullstack JS Project – Ziv Gilad


## Intro

This lesson is about a guided project on building a full stack client-server web application. In project is mostly based on your previous knowledge with few new things.

By fullstack we mean developing both the client and the server, combining several of the technologies learned.

The server side pieces consist of:

*	Node.js as the backend server,
*	Express.js as the web server framework, 
*	MongoDB as our database, 
*	Mongoose as our bridge between Node and MongoDB.


## Background

In this project we’ll build a client server college system and we’ll implement everything related to students. However we won’t be implementing any other entities such as classes and professors.
Our server is Node.js and our client is just your favorite browser.

The web server we build is what is known as a RESTfull API server.
What do we mean by RESTfull?
REST stands for representation state transfer, 
REST is just a series of rules for our web server, so everyone that uses our service can easily understand how it works.

The client sends requests and the server sends back replies.
This is straight forward, and it’s exactly how the real web works!

We will be accessing the server’s student resources and therefore our main url will be http://localhost/students.

Another piece of a uniform interface is the HTTP verbs (methods).
We’ve already learned about the GET method, but there are others.
In a RESTfull service the HTTP verbs determine the type of action that we want to perform on the resource:

Http GET just gets the data (a list of objects or a specific object, one student or a list of students, for example)

POST is used to add data, so post to http://localhost/students should add a new student.

DELETE removes a student from the list.

PUT updates an existing student.

Note: there’s also a PATCH verb for updating just a piece of the resource, which we won’t be using in this project.

### Stateless server

As the number of clients increase, we may want to add new server machines to support the load.
Therefore we do not want to store any client state in a particular server’s memory (because this memory is private to the server and cannot be shared with the other server machines).

At the best, the client will send in his request everything that the server needs for processing this request.
The server will reply with a response that is based only on this request.


## Let’s get started

Let’s begin with installing everything we need for our environment:
Refer to previous lessons on how to install node and MongoDB, then use NPM to install express, and Mongoose

Create a folder for your project named ‘FullstackProject’, then open a command prompt and navigate to this folder and type

`npm init`

As you learned in the NPM lesson, this creates the file package.json for us so we can later save the list of all packages that we’re going to use in the list of dependencies.
Just accept all defaults and make sure the package.json is created.
 
Let’s install express with the save option for updating the dependencies section of the package.json file (verify it after running the command):

`npm install express –save`

When we deploy our package, we wouldn’t need to send the express package with it. The clients can just type npm install and NPM will take care of all dependencies.

Now create a file named main.js and add the code to require express:

`var express = require('express');`

Add the code to create the express application and start a web server:

```javascript
var app = express();
app.listen(1337);
```

Let’s add a route to the root of our site:

```javascript
app.get('/', function (req, res) {
	res.send("You are inside the fullstack project")
});
```

Verify that you see the message in your browser:
 
![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image001.png)

OK then, finished setting up express and manage to run this framework on our node server

Let’s now move on to implement the http GET verb which will retrieve our data to the client (either one item or a list of items).

Let’s create a new route for getting a list of our students:

```javascript
app.get('/Students', function (req, res) {
	res.send({ students : [{ name: "David", grade: 85 }, { name: "Moshe", grade: 90 }] });
});
```

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image002.png)

OK, this is working, and we used static data.
Let’s add the code to retrieve this data from the MongoDB database:

We’ll need Mongoose for that, so let’s install it with the save option for updating the dependencies section of the package.json file (just as we did with express):

`npm install mongoose –save`

The Mongoose will convert our javascript objects into MongoDB documents and vice versa.

Let’s require Mongoose and connect it to our database:

```javascript
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017");
```

It would be cleaner if we separate our models from main.js, so let’s create a new file named models.js.
In this file we’ll define all the models that we’ll be using (student).

Require it from main.js using the require function:

`var models = require("./models");`

Open the models.js file, and add the two lines

```javascript
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
```

### Now it's your turn:

Create the schema for student named studentSchema.
The studentSchema should contain three properties: firstName, lastName and avarageGrades

 
### Answer:

```javascript
var studentSchema = new Schema({
	firstName: {type: String},
	lastName: {type: String},
	avarageGrades: {type: Number}
});
```

Next add the code to create a Student constructor and export it from the models.js module so we can use in in our main.js file:

### Answer:

```javascript
var Student = mongoose.model("Student", studentSchema);
module.exports.student = Student;
```

Back in main.js we can update the Students route to return the list of students from the MongoDB database:

```javascript
app.get('/Students', function (req, res) {
	models.Student.find(function (error, students) {
		res.send(students);
	});
});
```

How do we test that this code really works?
We’ve seen how to invoke this code from the browser, just navigate to http://localhost:1337/Students. But we can’t see anything because we don’t have any students in the DB.

The simplest way to add a new student to the database is through the mongo console window. Recall that we can add a new document using `db.<name of the collection>.save(<document>)`.
So let’s try that out:

```javascript
db.students.save({firstName: "John", lastName: "Smith", avarageGrades:88 });
```

And we can see the array of students:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image003.jpg)

##### Great, we’ve just managed to integrate express with node and Mongoose with MongoDB!

## Filtering the returned data

Usually we’re not interested in all the students in all classes, but only in a subset.
So it would be nice if we could pass a filtering parameter to the query string, for example:  http://localhost:1337/Students?firstName=John

In the express lesson we saw that we can access all query parameters 
uisng the request.query object.

Let’s see what request.query looks like by temporary modifying app.get('/Students'… to return req.query:

```javascript
res.send(req.query);
```

Let’s open the browser, write a query string and see what we get:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image004.png)

We see that express simply converts the query parameters into a JSON file, making it very easy to access these parameters.

If you recall from the Mongoose lesson, we can pass a query JSON object as the first parameter to the find function.
But is it a smart idea to pass the request.query directly into the find function (and pass it directly into the database)?
No its not. This because we do not have any control on the query string that the user types.
We must sanitize the data.

We can do it, for example, this way:

```javascript
var query = {};
if (req.query.firstName){
	query.firstName = req.query.firstName;
}
	
if (req.query.lastName)	{
	query.lastName = req.query.lastName;
}
	 
models.Student.find(query, function (error, students) {
	res.send(students);
}); 
Now let’s test that:
```
![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image005.jpg)

And we see that the query does work! We know how to search the database. And we also protected ourselves against random (or even malicious) user input.

### How about finding a student by his id?

We know that each student document has a unique id, so why don’t we use it to retrieve a specific user (we do not need an array of students, we only want one student)?

In the Express lesson we learned that we can add a route for student/id by using colon before the id:

```javascript
app.get('/Students/:id', function (req, res) {
```

And then access this parameter using `req.params.id.`

We’re going to use another version of find named findById which does exactly what the name implies – we pass it an id and get back one student (if exists). However the id doesn’t exists we would get an error.

Here’s is how our function looks:

```javascript
app.get('/Students/:id', function (req, res) {
	models.Student.findById(req.params.id, function (error, student) {
	if (error)
		res.send(error);
	else 
		res.send(student);
	});
}); 
```

And we launch node and pass a valid id we get:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image006.jpg)

And for the invalid Id case:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image007.png)

There we go! We managed to find a student by its id! Great!

### Now we want to add a new student to the database

We’ve seen how we can query the database for students, but what if we want to add a new student? This is definatly a mandatory requirement!
We mentioned before that in a RESTfull services the POST verb is used for adding new items.

So this is exactly what we need to add – a POST route!

Let’s add a meaningless post route just to make sure we manage to invoke it:

```javascript
app.post('/Students', function (req, res) {
	res.send("IN POST!!!");
});
```

But how do we invoke it? The browser address bar always issues GET requests. Never POSTs.

We can do it with AJAX!
Let’s add a simple html page calls our server using AJAX post. When we use AJAX we have the freedom to decide what verb the http request will use.

In your folder add the file ‘testpost.html’ and paste the following code into it:
```javascript
<!DOCTYPE html>
<html>
<head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
<script>
$(document).ready(function(){
	$("#postButton").click(function(){
		$.post("http://localhost:1337/Students", {}, function(result){
            $("#response").html(result);
        });
	});
});
</script>
</head>
<body>
	<button id="postButton" type="button">Post!</button>
	<div id="response"></div>
</body>
</html>
```

This page issues a post AJAX request upon clicking the value, and displays the response in the ‘response’ div.

When we double click the file the default browser opens with the address bar sets to file:///C:/tmp/NodeProjects/FullstackProject/testpost.html.

If we click the button we get the following error:

XMLHttpRequest cannot load http://localhost:1337/Students. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'null' is therefore not allowed access.

This happens because the browser protects against cross origin calls (CORS). The browser thinks that the html page came from a different server than the server that the AJAX points to, and applies a protection policy and just blocks the request.

To fix this problem we’ll change the server code to return “Access-Control-Allow” headers, meaning that the server approves all clients no matter where they came from. The easiest way is add these headers to every request using a global middleware (a function that gets in the middle of the request-response pipeline and can alter the response).

```javascript
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
```

Don’t worry about this code since we’re not going to get into it. Just do a copy-paste.

Now, when we double click the file and press the button we can see the response from the post route:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image008.png)

Great! We now know how to POST to our server to create a new student.

Let’s put in some real POST implementation, meaning we will insert a new student into the MongoDB database.
Of course we need to update the client testing page as well to post a new student to the server.

Let’s begin with the client side:
We could add the new student as the second parameter to the $.post like this:

```javascript
var newStudent = { firstName: "David", lastName: "Cohen", avarageGrades:90 };
    $.post("http://localhost:1337/Students", newStudent, function(result){
    $("#response").html(result);
 });
```
However this wouldn’t work for us, because this call sets the Content-Type as `www-form-urlencoded` while we want to work with JSON data (we want the content type to be `application/json`).

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image009.png)

Since $.post is just a wrapper around $.ajax, we’ll switch to using $.ajax which gives us more control:

```javascript
var newStudent = {firstName: "David", lastName: "Cohen", avarageGrades:90 };
$.ajax({
  url:"http://localhost:1337/Students",
  type:"POST",
  data:JSON.stringify(newStudent),
  contentType:"application/json; charset=utf-8",
  success: function(){
	$("#response").html(result);
  }
})
```

Well, this time we got it right:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image010.png)

Note: `JSON.stringify` is a must; otherwise the payload is formatted as form parameters:
`firstName=David&lastName=Cohen&avarageGrades=90`

OK then our testing page is ready. 

Let’s get back to the server side.
The easiest way to access the POST data from the client is to use a new NPM package with the name `body-parser`.

This is a small middleware (we’ve seen what a middleware is when we used the ‘Access-Control-Allow” headers) that looks into the body of the request for JSON objects and if it finds any, it will add it as a new property named ‘body’ to the request object. 


Install body-parser with the save option for updating the dependencies section of the `package.json` file (verify it after running the command):

```javascript
npm install body-parser --save
```

Add the following lines to require and use the "body-parser" middleware:

```javascript
var bodyParser = require("body-parser");
app.use(bodyParser.json);	// This is the type of body we're interested in
app.use(bodyParser.urlencoded({extended: true}));
```

Let’s see if it’s working. 
Modify the server code to return the `req.body` to the client. If everything works as expected, `req.body` contains the JSON data (the new student) that the client has just sent.

```javascript
app.post('/Students', function (req, res) {
	res.send(req.body);
});
```
Modify the client side code to display the JSON response as a string: 

```javascript
success: function(result){
	$("#response").html(JSON.stringify(result));
}
```

Now when we launch node and run the testing page, we get:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image011.png)

That’s exactly what we wanted – to be able to read the new student’s data from the client – and we succeeded!

### Save the new student in MongoDB

Now that we got the client-server interface stuff done, let’s implement the server side thing of saving the new student in MongoDB.

In the Monggose lesson we saw that `model.save()` saves the model to the MongoDB database. This is exactly what we need here.
Change the post code to save the new student to MongoDB:
 
```javascript
app.post('/Students', function (req, res) {
	var newStudent = new models.Student();
	
	if (req.body.firstName){
		newStudent.firstName = req.body.firstName;
	}
	if (req.body.lastName){
		newStudent.lastName = req.body.lastName;
	}
	if (req.body.avarageGrades){
		newStudent.avarageGrades = req.body.avarageGrades;
	}
	
	newStudent.save();
	res.status(201);
	res.send(newStudent);

});
```

Did it work?
When we type `db.students.find()` in the MongoDB console we get:

```javascript
{ "_id" : ObjectId("570d36c8e5928b104628f67a"), "avarageGrades" : 90, "lastName" : "Cohen", "firstName" : "David",…
```

We can also see it when we issue a GET request directly from the url-box:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image012.jpg)

The testing page displays the response on its body and we can see our student with its newly assigned id:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image013.jpg)

Another thing to note is the status code of **201**.
Why did we return a status of 201?
If we omit the line of code `res.status(201);` the server would return a status code of 200, meaning:

> The request has succeeded.

However a more suitable status is **201**, meaning that:
> “The request has been fulfilled and resulted in a new resource being created”

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image014.jpg)

The answer is: **yes it did**! It works! Our client page managed to add a new student to MongoDB database!

#### Great! We are now able to view the list of students with or without filtering and add a totally new student. Since everything is persisted in the MongoDB database, we can restart our computer and the data is still available for use!

### Now we want to delete an existing student from the database

Recall that in Mongoose we remove a document using `<model>.remove()`.
Also recall that there’s a dedicated HTTP verb named **DELETE**, which is used for removing items.

Therefore all we need to do is add to the server a new DELETE route with the following code:

```javascript
app.delete('/Students/:id', function (req, res) {
	models.Student.findById(req.params.id, function (error, student) {
		if (error) {
			res.status(500);
			res.send(error);
		}
		else {
			student.remove();
			res.status(204);
			res.end();
		}
	});
});
```

This code finds a student by its id and removes it from the MongoDB database.

Let’s check that out.
We know by now how to test HTTP verbs other than GET – with a test page with AJAX code.

Create a testing page named `testdelete.html` with the following code:

```javascript
<!DOCTYPE html>
<html>
<head>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js"></script>
<script>
$(document).ready(function(){
	$("#deleteButton").click(function(){
		$.ajax({
		  url:"http://localhost:1337/Students/1234",
		  type:"DELETE",
		  success: function(result){
			$("#response").html(JSON.stringify(result));
		  }
		})
	});
});
</script>
</head>
<body>
	<button id="deleteButton" type="button">Delete!</button>
	<div id="response"></div>
</body>
</html>
```

When we launch the testing page we get the following error:

##### XMLHttpRequest cannot load http://localhost:1337/Students/1234. Method DELETE is not allowed by Access-Control-Allow-Methods in preflight response.

If this sounds familiar, you’re right. We’ve encountered some “Access-Control-Allow” error in the POST route, and fixed it by adding response headers.

##### Why not fix it the same way?

To the previous POST middleware add another response header:

```javascript
res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
```

Now when we launch the testing page we manage to reach our server!

But since we used a non-existing student id (1234), the server returns an error to the client:

```javascript
{message: "Cast to ObjectId failed for value "1234" at path "_id"", name: "CastError",…}
kind:"ObjectId"
message:"Cast to ObjectId failed for value "1234" at path "_id""
name:"CastError"
path:"_id"
value:"1234"
```

 We can see the 500 status that from server in Chrome’s network tab:

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image015.png)

Why did we return a status of 500?
Error 500 means:

> ”unexpected condition that prevented it from fulfilling the request by the client”. 

This is a sort of 'catch-all' error.

When we change the id to be the one that returned from our previous post (and we know that exists in the database): `url:"http://localhost:1337/Students/570d36c8e5928b104628f67a"`, our server returns our status 204.

Why did we return a status of 204?
Status 204 means No-Content:

> "The server has fulfilled the request but does not need to return an entity-body"

![](https://raw.githubusercontent.com/zivgi/ElevationAcademy/master/Fullstack%20JS%20Project_files/image016.png)


Let’s check that the student was removed from the database:
When we type `db.students.find()` nothing returns.
When we type `http://localhost:1337/Students` in the url-box we get back an empty array `[]`.

##### It worked! We successfully deleted our existing student!

### Done.
##### Great. That's it! We are now able to view the list of students with or without filtering, add a new student and delete an existing student. And everything is persisted in the MongoDB database. Nothing is lost when we restart our computer!
