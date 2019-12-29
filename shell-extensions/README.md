
# MongoDB Shell Extensions

The script [mongodb-shell-extensions.js](mongodb-shell-extensions.js) adds some handy utilities to the mongo shell.

## Quick intro

Here's a simple example that condenses the utilities:
```js
db.players.set1("5e07ce013dca4d04ea3f6552", {score:Double(5)})
```

This statement will do this:
```js
db.players.update({_id:"5e07ce013dca4d04ea3f6552"}, {$set:{score:5}})
```

The function `set1` will force you to specify the type of numbers. If you just write `score:5`, the statement will fail because of [number type-safety](#number-type-safety).

Besides, by adding more [query expansions](#query-expansions), you could easily be able to execute a statement like this too:
```js
db.players.set1("some@mail.com", {score:Double(5)})
```

Below, you will find more details about how this works.





## Installation

Just load the script when opening your mongo shell. You have different options:

1. Use the `mongo` command argument:

```shell script
mongo mongodb-shell-extensions.js --shell
```

2. Load it from inside the shell:

```js
load("mongodb-shell-extensions.js")
```

3. Add that `load("mongodb-shell-extensions.js");` statement to your `~/.mongorc` file so `mongodb-shell-extensions.js` is automatically loaded every time you start a mongo shell.


## Usage

You have these new functions:

```js
db.col.find1(q) // similar to: db.col.findOne(q)
db.col.findN(q) // similar to: db.col.find(q).pretty()
db.col.set1(q, u) // similar to: db.col.update(q, {$set: u})
db.col.setN(q, u) // similar to: db.col.update(q, {$set: u}, false, true)
db.col.safeInsert(o) // similar to: db.col.insert(o)
```

Those new functions have 2 peculiarities:

1. The updates `u` and the inserted object `o` are checked so that numbers are specified using explicit types like `Int(1)`, `Long(23)` or `Double(7)`.  More on this in **Number type-safety**.
2. The query `q` is expanded using the function `MongoUtil.expandQuery`.  More on this in **Query expansions**.

## Number type-safety

The numbers in the updates `u` and the inserted object `o` must be given with explicit type, even for `double` values. It is mandatory to use `Int`, `Long` or `Double`. Those are shorter aliases for `NumberInt` and `NumberLong` (`NumberDouble` doesn't exist so use `Double`).

Examples:
```js
db.col.safeInsert({count:Int(3), score:Double(7)})
db.col.setN({count:3}, {score:Double(7)})
```

Note that the query doesn't need explicit type.

## Query expansions

The query `q` of the functions indicated before are expanded when some known object types or patterns are found. For now, they just detect that `q` is an `ObjectId` or a string that looks like an `ObjectId`:

```js
db.col.set("5e07ce013dca4d04ea3f6552", {text:"hello"})
```

That statement is equivalent to (notice the `ObjectId` and the `$set`):

```js
db.col.update({_id: ObjectId("5e07ce013dca4d04ea3f6552")}, {$set:{text:"hello"}})
```

### Configuring query expansions

You may override the query expansions or add more of your own. After loading the `mongodb-shell-extensions.js`, modify the `MongoUtil.expandQuery` function.

Here's an example where we want to expand a query that looks like an email to `{email: query}` . This code could be in the `~/.mongorc.js` file.

```js
load("mongodb-shell-extensions.js");

// Save the original expandQuery function
const originalExpandQuery = MongoUtil.expandQuery;

// Replace expandQuery with another implementation
MongoUtil.expandQuery = function(query) {

	const emailRegex = /^[\w.\-]+@[\w.\-]+$/; // simplified regex
	if (emailRegex.test(query)) {
		return {email: query};
	}

	// Here we want to fall back to the original expansions but
	// we could `return query` to use the email expansion only.
	return originalExpandQuery(query);
};

```
