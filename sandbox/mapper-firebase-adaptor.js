function FirebaseAdaptor(url) {
	this.baseref = new Firebase(url);
}
FirebaseAdaptor.prototype = {
	constructor: FirebaseAdaptor,
	once: function(property) {
		var promise = $.Deferred();
		this.baseref.child(property).once('value', this._resolvePromiseWithSnapshotValue.bind(this, promise));
		return promise;
	},
	onChange: function(callback) {
		this.baseref.on('child_changed', this._callCallbackWithSnapshotValue.bind(this, callback));
	},
	_resolvePromiseWithSnapshotValue: function(promise, snapshot) {
		promise.resolve(snapshot.val());
	},
	_callCallbackWithSnapshotValue: function(callback, snapshot) {
		callback(snapshot.name(), snapshot.val());
	}
};