#### 24/04/2016
# Advanced Mongoose – Population (Ziv Gilad)


## Lesson Overview
* Define the Problem
* Populate our Books Collection
* Get all Reviews for a Single Reviewer
* Book, Reviewer and Review – Adding with Mongoose
* Population
* Setting Populated Fields
* Population Field selection
* Populating Multiple Properties
* Working with Arrays
* Populating Array of Sub Documents

## Define the problem
**MongoDb** is a document DB, meaning that we have collections of documents where each document contains all the data it needs (properties, array) by himself.
 
On the other hand, traditional databases (**relational databases**) separate their date into several tables, so data that is shared between items of one table can be stored separately in another table, removing the need to duplicate the data (the sharing items keep a reference to the shared data on the other table).

This is known as the **DRY** principle – do not repeat yourself, and it’s a very important principle in architectural design of software. 
   
What it we want to apply this relational approach to MongoDB, i.e. using the DRY principle? How do we store a reference between two separate collections? 

We’ll explain that as well as explain what population means and how it’s related to this story.

### Populate our Books Collection

Let’s begin with an example.
Suppose we have a books – e-commerce store and we’re planning to grow and sell thousands of books (think of Amazon).

#### Let’s define the Book and the Review schema:

```javascript
var bookSchema = new Schema({
  title: {type: String},
  author: {type: String},
  reviews: []	// Just an empty array
});
```

Each review in the reviews collection has the schema of:

```javascript
var reviewSchema = new Schema({
  name: String,
  text: String
});
```
Does it sound familiar? Yes it does. It’s almost identical to the **BeerList** project! 

Why am I using books instead of beers? This is because I’m trying to emphasize a point – I want to be able to sell thousands of books (and I'm not aware of any bars who sell more than few hundreds of different beers).

### Exercise:
Let’s add a book with one review through the mongod console.
If you can’t remember, open up the MongoDB lesson and refresh your memory.

### Answer:

```javascript
db.books.save({name:"book1", author:"author1", reviews:[{name:"David123abc", test:"good book"}]})
```

We can see on the console that 1 book was added:

```javascript
WriteResult({ "nInserted" : 1 })
```
**Ok then, we have one book in our store. That’s a start!**

### Get all Reviews for a Single Reviewer.

Suppose our reviewer wants to see a list of his reviews.
Why does he want to do it? He has his reasons (for example, show them to his wife).

##### The MongoDB command for that is:

```javascript
db.books.find({reviews:{$elemMatch:{name:"David123abc"}}})
```

or in a simpler format:

```javascript
db.books.find({"reviews.name":"David123abc"})
```

And we can see all books with our reviewer’s reviews.
  
The reviews is an array and might contain other reviewers’ reviews, so let’s filter that out using find function’s second parameter:

```javascript
db.books.find({"reviews.name":"David123abc"}, {name: 1,reviews:{ $elemMatch: {name:"David123abc"}}}) 
```

This works (believe me) and returns a list of book names together with our reviews.

#### We’re done with the direct MongoDB code, we saw enough to explain the next points:

1.	Do you think that searching the books collection for our reviewer’s few reviews is efficient? Remember – we want to sell thousands of books.
**Of course it’s not.**

2.	We used the name "David123abc" for a purpose – we wanted our name to be unique. Can we prevent someone from using just David? **What if we have 100 reviewers named “David”?**

#### How can we fix these two problems?
We can use split the data into several collections:
* Books
* Reviewers
* Reviews

Each book, review and reviewer will get its unique id (because that’s the way it is in MongoDB) and we can store these id’s as a reference from one collection to another.

#### Let’s change the schemas to be:

```javascript
var bookSchema = new Schema({
  title: {type: String},
  author: {type: String},
  reviews: [{ type : Schema.ObjectId}]
});

var reviewSchema = new Schema({
  text: String,
  reviewer : Schema.ObjectId,
  book: Schema.ObjectId
});

var reviewerSchema = new Schema({
  name: String,
  reviews: [{ type : Schema.ObjectId}],
  });
```

#### We fixed both problems:

Each reviewer has his unique id, no matter how many “Davids” we have,
The review isn’t duplicated, a book and a reviewer point at the same review in a separate collection, it’s referenced from two other collections,
We do not need so search all books for this reviewer’s books because each reviewer has an array of his reviews!

**That’s great.**

## Book, Reviewer and Review – Adding with Mongoose

Now that our schemas are defined, let’s use them to add one book, one reviewer and one review, and connect them all:

```javascript
var book = new models.Book({title: "Book1", author: "Author 1"});
book.save(function(err, book){
	var reviewer = new models.Reviewer({name: "David"});
	reviewer.save(function(err, reviewer){
		var review = new models.Review({text: "Good book", book: book._id, reviewer: reviewer._id});
		review.save(function(err, review){
			book.reviews.push(review._id);
			book.save(function(err, book){});
			reviewer.reviews.push(review._id);
			reviewer.save(function(err, book){});
		});
	});
});
```

Run node and let’s see what we got in the `mongo` console:

```javascript
> db.books.find()
{ "_id" : ObjectId("5718d0e7d0b9aec014ae14ab"), "title" : "Book1", "author" : "Author 1", "reviews" : [ ObjectId("5718d0e7d0b9aec014ae1
4ad") ], "__v" : 1 }
> db.reviewers.find()
{ "_id" : ObjectId("5718d0e7d0b9aec014ae14ac"), "name" : "David", "books" : [ ], "reviews" : [ ObjectId("5718d0e7d0b9aec014ae14ad") ],
"__v" : 1 }
> db.reviews.find()
{ "_id" : ObjectId("5718d0e7d0b9aec014ae14ad"), "text" : "Good book", "book" : ObjectId("5718d0e7d0b9aec014ae14ab"), "reviewer" : Objec
tId("5718d0e7d0b9aec014ae14ac"), "__v" : 0 }
>  
```

You see? It all matches: We got a book that pointing to its review and a reviewer that’s pointing to the same review books. The review points t its reviewer and to its book.

Now that’s all references are in place, it’s easy to reach the desired data – we just need to invoke `findById` on the appropriate collection:

```javascript
models.Book.findById("5718d0e7d0b9aec014ae14ab", function (err, item){console.log(item);});
```

But isn’t it a bit tedious? Fetching those ObjectIds, then reaching back to MongoDB for the actual data?

Wouldn’t it be nice if Mongoose was able to do it on our behaf?
 
**This is where Mongoose population comes into the picture!**

## Population

From the mongoose docs:

> Population is the process of automatically replacing the specified paths in the document with document(s) from other collection(s).

**An example will better explain:**

Change the model to this (same model with one change: `ref: 'Book'`):

```javascript
var reviewSchema = new Schema({
  text: String,
  reviewer : Schema.ObjectId,
  book: { type: Schema.ObjectId, ref: 'Book' }
});
```

Type the following code and see if you spot any difference:

```javascript
models.Review.findById("5718d0e7d0b9aec014ae14ad", function (err, item){console.log(item);});
```

And we get:

```javascript
{ book: 5718d0e7d0b9aec014ae14ab,
  __v: 0,
  reviewer: 5718d0e7d0b9aec014ae14ac,
  text: 'Good book',
  _id: 5718d0e7d0b9aec014ae14ad }
```

**No difference at all.**

Now recall that when `findById` is invoked without the callback parameter, `findById` doesn’t access the database but returns a ‘query’ object instead (this was mentioned in the `Mongoose` lesson).
To access the database we need to invoke ‘`exec`’ function of the query and pass the callback we omitted from `findById`.

But we’ll add an extra step between `findById` and `exec`, and call the ‘`populate`’ function:

```javascript
var query = models.Review.findById("5718d0e7d0b9aec014ae14ad");
query.populate('book');
query.exec(function (err, item) {	console.log(item);
});
```

Here’s what we see on the node console:

```javascript
{ book:
   { reviews: [Object],
       __v: 1,
       author: 'Author 1',
       title: 'Book1',
       _id: 5718d0e7d0b9aec014ae14ab } ,
  __v: 0,
  reviewer: 5718d0e7d0b9aec014ae14ac,
  text: 'Good book',
  _id: 5718d0e7d0b9aec014ae14ad }
```

**Now we can definitely see a difference – The book property has been populated.**

How did it happen? When we invoked the populate command, we passed the name of the property:

```javascript
query.populate('book');
```

Mongoose looked for the book property definition:

```javascript
book: [{ type: Schema.ObjectId, ref: 'Book' }]
```

Then it found that `ObjectId`  value pertains to the model ‘Book’ (`ref: 'Book'`) and Mongoose knows that 'Book' models reside in the Books collection, so it fetched this book out of the Books collection and populated the ‘book’ property.

He did all of that for us, so we wouldn’t need to do that work ourselves.
**Quite nice, ha?**

Here’s what the Mongoose site says about population:

> “Populated paths are no longer set to their original _id , their value is replaced with the mongoose document returned from the database by performing a separate query before returning the results.”

### Exercise:

What happens if we pass a non-existing model name to ref, for example?
```javascript
book: [{ type: Schema.ObjectId, ref: 'Book1' }]
```

Try out for yourself.

### Answer:

We get the error:
```javascript
Schema hasn't been registered for model "Book1".
```

This is because the `ref` attribute must match exactly the model name in your model definition. Otherwise we’re getting


## Setting Populated Fields.

Wouldn’t it be nice if we could set the populated fields directly with objects? ObjectId’s belong to the database and we do not want them to clutter our code.

Let’s try setting the populated fields directly with object:

```javascript
var book = new models.Book({title: "Book1", author: "Author 1"});
var reviewer = new models.Reviewer({name: "David"});
var review = new models.Review({text: "Good book", book: book, reviewer: reviewer});
book.reviews.push(review);
reviewer.reviews.push(review);
review.save(function(err, review){});
book.save(function(err, book){});
reviewer.save(function(err, reviewer){});
```

And see what got into the database:

```javascript
> db.reviews.find()
{ "_id" : ObjectId("571b3f4ebe5936c85ec65047"), "text" : "Good book", "book" : ObjectId("571b3f4ebe5936c85ec65045"), "reviewer" : Objec
tId("571b3f4ebe5936c85ec65046"), "__v" : 0 } 
```

That’s look nice. Although we haven’t used any ObjectIDs, Mongoose knew that the ‘book’ and ‘reviwer’ fields are ObjectIds and behind the scenes saved only the ObjectIds to the database.

### Exercise:
Make sure population still works – Populate the ‘book’ property of the review and see for yourself.

### Answer:

This is what we get:

```javascript
{ __v: 0,
  reviewer: 571b3f4ebe5936c85ec65046,
  book:
   { reviews: [ 571b3f4ebe5936c85ec65047 ],
     __v: 0,
     author: 'Author 1',
     title: 'Book1',
     _id: 571b3f4ebe5936c85ec65045 },
  text: 'Good book',
  _id: 571b3f4ebe5936c85ec65047 }
It’s working!
```

## Population Field selection

We managed to get the book property of the review object populated, which is good.
However we do want to reduce bandwidth and return only the book’s properties that we’re interested in.

We want to be able to select which fields will be populated.
Fortunately the populate function has an optional second argument for exactly this purpose – for choosing which fields will be populated and which will be ignored.

For example, if we want only the book title we could write:

```javascript
query.populate('book', 'title');
```

And get:

```javascript
book: { title: 'Book1', _id: 571b3f4ebe5936c85ec65045 },
```

Recall that the _id is a special field and is returned by default unless explicitly excluded.

The field name syntax is explained in the Mongoose documentation  [here](http://mongoosejs.com/docs/api.html#query_Query-select).

### Extended Exercise:

Take a look at the field name syntax docs, and change the code in such a way that the populated book will return only the ‘title’ and the ‘author’. The _id field shouldn’t be returned.

### Answer
```javascript
query.populate('book', 'title author -_id');
```

We then see on the node console that only ‘title’ and ‘author’ have been populated:

```javascript
book: { author: 'Author 1', title: 'Book1' },
```

### Exercise:
Revisit the `reviewSchema` and change the ‘reviewer’ definition to support population.

### Answer:
We just need to change:
```javascript
reviewer : Schema.ObjectId,
```
into:

```javascript
reviewer: { type: Schema.ObjectId, ref: 'Reviewer' }
```

## Populating Multiple Properties.

We have our review in our hand, and we want to populate both the ‘book’ and the ‘reviewer’ properties.

How do we do that?

We have two options:

1.	Use space delimited path names
```javascript
query.populate('book reviewer');
```
2.	Use two separate lines:
```javascript
query.populate('book');
query.populate('book');
```
The result is exactly the same:

```javascript
{ __v: 0,
  reviewer:
   { reviews: [ 571b3f4ebe5936c85ec65047 ],
     books: [],
     __v: 0,
     name: 'David',
     _id: 571b3f4ebe5936c85ec65046 },
  book:
   { reviews: [ 571b3f4ebe5936c85ec65047 ],
     __v: 0,
     author: 'Author 1',
     title: 'Book1',
     _id: 571b3f4ebe5936c85ec65045 },
  text: 'Good book',
  _id: 571b3f4ebe5936c85ec65047 }
```

However if we want to populate selected fields, we better use the second option to be able to call populate function with a second argument!

### Exercise:
This one is easy. For the book property populate the ‘title’ and ‘author’ fields (as we did this already) and for the reviewer populate only the ‘name’ field.

### Answer:

The code is

```javascript
query.populate('book', 'title author -_id');
query.populate('reviewer', 'name -_id');
```

And we get

```javascript
reviewer: { name: 'David' },
book: { author: 'Author 1', title: 'Book1' },
```

## Working with Arrays

Let’s add another review from the same reviewer to the same book:

```javascript
var review = new models.Review({text: "I like it", book: "571b3f4ebe5936c85ec65045", reviewer: "571b3f4ebe5936c85ec65046"});
review.save(function(err, review){});
```

And

```javascript
models.Book.findById("571b3f4ebe5936c85ec65045", function (e, book){
	book.reviews.push(review);
	book.save(function(err, book){});
});
```

Then update the bookSchema’s review property to be:

```javascript
reviews: [{ type : Schema.ObjectId, ref: 'Review'}]
```

Notice that even though this property is an array, the format stays the same.

When we populate the book using the following code:

```javascript
var bookQuery = models.Book.findById("571b3f4ebe5936c85ec65045");
bookQuery.populate('reviews');
bookQuery.exec(function (err, item) {
	console.log(item);
});
```

We get the two populated reviews:

```javascript
{ reviews:
   [ { __v: 0,
       reviewer: 571b3f4ebe5936c85ec65046,
       book: 571b3f4ebe5936c85ec65045,
       text: 'Good book',
       _id: 571b3f4ebe5936c85ec65047 },
     { __v: 0,
       reviewer: 571b3f4ebe5936c85ec65046,
       book: 571b3f4ebe5936c85ec65045,
       text: 'I like it',
       _id: 571b4f43a53630f858aafba1 } ],
  __v: 1,
  author: 'Author 1',
  title: 'Book1',
  _id: 571b3f4ebe5936c85ec65045 }
```

This is OK; however few things still bother us:
1.	We do not want to return all fields for each review
2.	We want to be able to limit the number of reviews (for example, we want to display only 5 reviews).
3.	We want to be able to get the reviews sorted (for example by text, by rank)
4.	We want to be able to return only reviews that match a certain criteria (for example, only reviews with rank equals 5).
5.	We might want to populate the review’s reviewer properties.

**Let’s see how we can fix each one of these.**

The populate function’s first argument can be changed to be a configuration object:

```javascript
bookQuery.populate({
	path: 'reviews',
	select: 'text -_id'
});
```

`Select` is the field selection string, and we’ve seen this format already.

When we run the code we get:

```javascript
{ reviews: [ { text: 'Good book' }, { text: 'I like it' } ],
  __v: 1,
  author: 'Author 1',
  title: 'Book1',
  _id: 571b3f4ebe5936c85ec65045 }
```

This fixes the first problem – the array is populated with only the properties that we’re interested in.

#### Limiting the number of populated elements in array:
Just add options with limit: <limit>:

```javascript
bookQuery.populate({
	path: 'reviews',
	select: 'text -_id',
	options: { limit: 1 }
});
```

Try for yourself and you’ll see that only one element is returned:

```javascript
reviews: [ { text: 'Good book' } ],
```

#### Sorting the populated elements:

This is another options settings:
Use `sort: <field>` for ascending and `sort: -<field>` for descending:

```javascript
options: { sort: '-text'} or options: { sort: 'text'},
```

### Exercise:
Go ahead and try these two options

### Answer:

```javascript
sort: '-text': reviews: [ { text: 'I like it' }, { text: 'Good book' } ]
sort: 'text': reviews: [ { text: 'Good book' }, { text: 'I like it' } ]
```

Great. What about returning only reviews that received a rank higher than a certain value?
This is just another configuration item named ‘`match`’ and it’s used this way: 

```javascript
match: { rank: { $gte: 4 }},
```
This means we only want to receive reviews from the reviews array with a rank greater or equal to 4.

We met the `query operators` in the MongoDB lesson, so go ahead and open this lesson if you need to refresh your memory.

**Let’s demonstrate that:**
We have two reviews in the database, but without a rank.

In the Mongoose lesson we met the `$set` operator which together with ‘`update`’ updates an existing field or adds a new one if doesn’t exist.
Let’s use this operator to add the rank:

```javascript
db.reviews.update({_id:ObjectId("571b3f4ebe5936c85ec65047")}, {$set:{rank:3}})
```
And

```javascript
db.reviews.update({_id:ObjectId("571b4f43a53630f858aafba1")}, {$set:{rank:5}})
```

Let’s see the result:

```javascript
> db.reviews.find()
{ "_id" : ObjectId("571b3f4ebe5936c85ec65047"), "text" : "Good book", "book" : ObjectId("571b3f4ebe5936c85ec65045"), "reviewer" : Objec
tId("571b3f4ebe5936c85ec65046"), "__v" : 0, "rank" : 3 }
{ "_id" : ObjectId("571b4f43a53630f858aafba1"), "text" : "I like it", "book" : ObjectId("571b3f4ebe5936c85ec65045"), "reviewer" : Objec
tId("571b3f4ebe5936c85ec65046"), "__v" : 0, "rank" : 5 }
```

And it works! We added a rank to the database.

### Exercise:
Now add the rank property on the Mongoose side

### Answer:
Update the reviewSchema to be:

```javascript
var reviewSchema = new Schema({
  text: String,
  rank: Number,
  reviewer: { type: Schema.ObjectId, ref: 'Reviewer' },
  book: { type: Schema.ObjectId, ref: 'Book' }
});
```

Now it’s time to demonstrate the ‘match’ configuration item:
Call populate with the following configuration:

```javascript
bookQuery.populate({
	path: 'reviews',
	select: 'text rank -_id',
	match: { rank: { $gte: 4 }},
	options: { limit: 2, sort: 'text'},
});
```
 
And we get:

```javascript
reviews: [ { rank: 5, text: 'I like it' } ]
```

### Exercise:
Now we want to return only reviews with rank less or equal to 4.

### Answer:
The match configuration should be changed to

```javascript
match: { rank: { $lte: 4 }},
```

And we get:

```javascript
reviews: [ { rank: 3, text: 'Good book' } ],
```

**Great. Now for the final question:**

How can we populate the book’s review’s reviewer properties?
In other words, we have a book and we know how to populate its reviews, and now we want to populate the reviewer of the populated review.

## Populating Array of Sub Documents

The reviews is an array of sub documents. Without population this is just an array of references (ObjectIds).

We can add a 'populate' configuration with desired 'path'.
For example, if we want to populate the book property of each review, we need add the following to our configuration configuration:

```javascript
bookQuery.populate({
	path: 'reviews'
	populate: {
      path: 'reviewer'
    } 
});
```

This tells Mongoose to populate the reviews array, and for each item of the array populate the book property.

Let’s check that out:

```javascript
bookQuery.exec(function (err, item) {
	console.log(item.reviews[0]);
});
```
And we can see that the review item got populated with the reviewer:

```javascript
{ rank: 3,
  __v: 0,
  reviewer:
   { reviews: [ 571b3f4ebe5936c85ec65047 ],
     books: [],
     __v: 0,
     name: 'David',
     _id: 571b3f4ebe5936c85ec65046 },
  book: 571b3f4ebe5936c85ec65045,
  text: 'Good book',
  _id: 571b3f4ebe5936c85ec65047 }
```

### Final Exercise:
Complete the project by modifying reviewerSchema to support population.

### Answer:

Here’s the modified schema:

```javascript
var reviewerSchema = new Schema({
  name: String,
  reviews: [{ type : Schema.ObjectId, ref: 'Review'}],
  books: [{ type : Schema.ObjectId, ref: 'Book'}]
});
```

### Congratulations! You now know how to work with Mongoose population, and you can implement this knowledge on you BeerList project.
