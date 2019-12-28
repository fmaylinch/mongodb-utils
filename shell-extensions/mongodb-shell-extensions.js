
// Extension methods for MongoDB shell.
// Some of them are inspired by https://github.com/TylerBrock/mongo-hacker.

/**
 * Updates a single object. See set() method.
 * Example: db.players.set1("56f6ca7e7f74b4fb3e3f7daf", {points:Int(3)})
 */
DBCollection.prototype.set1 = function(query, updates) {
	return this.set(query, updates, false);
};

/**
 * Updates multiple objects. See set() method.
 * Example: db.users.setN({city:"Barcelona"}, {province:"Barcelona"})
 */
DBCollection.prototype.setN = function(query, updates) {
	return this.set(query, updates, true);
};

/**
 * Safe update to just set values (using $set), not replace objects.
 * For type-safety reasons, numbers must be specified as Int(x), Long(x) or Double(x).
 *
 * @param query      query to find objects to modify, it's expanded using expandQuery()
 * @param updates    object with properties to set
 * @param multi      update multiple documents (it's required for safety reasons)
 * @param upsert     insert object if not found (default is false)
 *
 * Example: db.players.set("56f6ca7e7f74b4fb3e3f7daf", {points:Int(3)}, false)
 * Example: db.users.set({city:"Barcelona"}, {province:"Barcelona"}, true)
 */
DBCollection.prototype.set = function(query, updates, multi, upsert) {

	if (!updates) throw "updates are not specified";
	if (multi === null || multi === undefined) throw "multi is not specified";

	MongoUtil.assertSafeNumbers(updates);

	return this.update(MongoUtil.expandQuery(query), {$set:updates}, upsert, multi);
};

/**
 * This is like insert but, for type-safety reasons, numbers must be specified as Int(x), Long(x) or Double(x)
 *
 * Example: db.players.insert({name:"Max", score:Int(8), height:Double(1.75)})
 */
DBCollection.prototype.safeInsert = function(object) {

	MongoUtil.assertSafeNumbers(object);

	return this.insert(object);
};

/** Like find() with pretty() and expandQuery(). */
DBCollection.prototype.findN = function(query, select) {
	return this.find(MongoUtil.expandQuery(query), select).pretty();
};

/** Like findOne() with expandQuery() */
DBCollection.prototype.find1 = function(query, select) {
	return this.findOne(MongoUtil.expandQuery(query), select);
};


/**
 * Utilities used in these extensions
 */
var MongoUtil = {

	objectIdRegex: /^[0-9a-fA-F]{24}$/,

	/**
	 * Expands query if known objects or patterns are found.
	 *
	 * MongoDB shell sometimes does some expansions. See `db.anyCollection._massageObject`.
	 * It works for find() and remove() but not for update*() methods.
	 */
	expandQuery: function expandQuery(query) {

		if (!query) return query;

		if (query.isObjectId) { // ObjectId objects have this field to true
			return {_id: query};
		} else if (typeof query === "string") {
			if (MongoUtil.objectIdRegex.test(query)) {
				return {_id: ObjectId(query)};
			}
		}

		return query;
	},

	/**
	 * Checks that numbers inside object are specified with safe number constructors
	 */
	assertSafeNumbers: function(object) {

		for (key in object) {

			var value = object[key];

			if (value === null) continue;
			
			// Do not allow unsafe numbers
			if (typeof value === "number") {
				throw "For safety reasons, specify number in `" + key + ":" + value + "` as Int("+value+"), Long("+value+") or Double("+value+")"
			}

			// Check values inside object recursively, except for safe objects
			if (typeof value === "object" && !MongoUtil.isSafeObject(value)) {

				// _NumberDouble is a special type that we use to specify doubles
				if (value.constructor.name === "_NumberDouble") {
					object[key] = value.number; // replace with actual number

				} else {
					MongoUtil.assertSafeNumbers(value);
				}
			}
		}
	},

	isSafeObject: function(obj) {
		return MongoUtil.safeTypes.indexOf(obj.constructor.name) >= 0;
	},

	// Object types that we don't need to check
	safeTypes: ["ObjectId", "Date", "NumberInt", "NumberLong"]
};


// Type functions/constructors

function Id(x) {
	return ObjectId(x);
}

function Int(x) {
	return NumberInt(x);
}

function Long(x) {
	return NumberLong(x);
}

// There's no class for doubles so we prepare one

function Double(x) {
	return new _NumberDouble(x);
}

function _NumberDouble(x) {
	this.number = x;
}


// Other functions

/** Convenience for queries: e.g. {corpId: not(null), state: not(0)}, etc. */
function not(x) { return {$ne: x} }

ObjectId.equals = function(id1, id2) {

	if (!id1 && !id2) return true; // we consider null and undefined are equal
	if (!id1 !== !id2) return false; // not equals if only one id is null/undefined
	return id1.str === id2.str;
};
