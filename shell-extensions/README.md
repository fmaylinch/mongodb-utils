# MongoDB Shell Extensions

The script `mongodb-shell-extensions.js` adds some handy utilities to the mongo shell.


## Installation

Just load the script when opening your mongo shell. You have different options:

1. Use the `mongo` command argument:

```bash
mongo mongodb-shell-extensions.js --shell
```

2. Load it from inside the shell:

```js
load("mongodb-shell-extensions.js")
```

3. Add that `load("mongodb-shell-extensions.js");` statement to your `~/.mongorc` file so `mongodb-shell-extensions.js` is automatically loaded every time you start a mongo shell.


## Usage

You have these new functions:

- `db.col.find1(q)` is similar to `db.col.findOne(q)`.
- `db.col.findN(q)` is similar to `db.col.find(q).pretty()`.
- `db.col.set1(q, u)` is similar to `db.col.set(q, {$set: u})`.
- `db.col.setN(q, u)` is similar to `db.col.set(q, {$set: u}, false, true)`.
- `db.col.safeInsert(o)` is similar to `db.col.insert(o)`.

Those new functions have 2 peculiarities:

1. The query `q` is expanded using the function `MongoUtil.expandQuery`. You may add more expansions; more on that later.
2. The updates `u` and the inserted object `o` are checked so that numbers are specified using explicit types like `Int(1)`, `Long(23)` or `Double(7)`. Those types are shorter aliases for `NumberInt` and `NumberLong` (`NumberDouble` doesn't exist, so `Double` is added to explicitly specify that it's a `double` number).

## Query expansions

The query `q` of the methods indicated before are expanded when some known object types or patterns are found. For now, they just detect that `q` is a string that looks like an `ObjectId`:

`db.col.set("5e07ce013dca4d04ea3f6552", {text:"hello"})`

That statement is equivalent to (notice the `ObjectId` and the `$set`):

`db.col.update({_id: ObjectId("5e07ce013dca4d04ea3f6552"), {$set:{text:"hello"}})`

### Configuring query expansions

You may override the query expansions or add more of your own. After loading the `mongodb-shell-extensions.js`, modify the `MongoUtil.expandQuery` function.

Here's an example where we want to expand a query that looks like an email and search by `{email: query}` in that case. This could be in the `~/.mongorc.js` file.

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

	// Here we also want the original expansions but
	// we could `return query;` to use the email expansion only.
	return originalExpandQuery(query);
};

```
