var observer = require('observer');
var Q = require('q');

function Mapper(store, map) {
	this.store = store;
	this.map = map;
	this.viewModel = {};
	this.dependencyMap = {};
}
Mapper.prototype = {
	constructor: Mapper,
	init: function() {
		this.processMap();
		this.processCalculatedProperties();
		this.bind();
    return this.viewModel;
	},
	processMap: function() {
		Object.keys(this.map).forEach(this.processMapping.bind(this));
	},
	processMapping: function(property) {
		var mapping = this.map[property];
		if(typeof mapping === 'string') {
			this.store.once(property).then(this.setProperty.bind(this, property));
		} else {
			var callback = mapping.pop();
			mapping.forEach(this.registerDependency.bind(this, {
				prop: property,
				cb: callback,
				deps: mapping
			}));
		}
	},
  getProperty: function(property) {
    return this.viewModel[property];
  },
  setProperty: function(property, value) {
    this.viewModel[property] = value;
  },
	registerDependency: function(relationship, dependency) {
		if(!this.dependencyMap[dependency]) {
			this.dependencyMap[dependency] = [];
		}
		this.dependencyMap[dependency].push(relationship);
	},
	processCalculatedProperties: function() {
		var processed = [];
		Object.keys(this.dependencyMap).forEach(this.processDependency.bind(this, processed));
	},
	processDependency: function(processed, dep) {
		this.dependencyMap[dep].forEach(this.processDependencyRelationship.bind(this, processed));
	},
	processDependencyRelationship: function(processed, relationship) {
		var sig = relationship.prop;
		if(processed.indexOf(sig) < 0) {
			this.initDependent(relationship);
			processed.push(sig);
		}
	},
	initDependent: function(relationship) {
		Q.all(relationship.deps.map(this.store.once.bind(this.store)))
			.done(this.setDependent.bind(this, relationship));
	},
	setDependent: function(relationship, dependencyValues) {
		this.viewModel[relationship.prop] = relationship.cb.apply(this, dependencyValues);
	},
	bind: function() {
		this.store.onChange(this.onChange.bind(this));
		observer(this.viewModel, this.onViewModelChange.bind(this));
	},
	onChange: function(name, value) {
		this.viewModel[name] = value;
	},
	onViewModelChange: function(path, type, oldValue, newValue) {
		if(this.dependencyMap[path]) {
			this.dependencyMap[path].forEach(this.updateDependent.bind(this));
		}
	},
  updateDependent: function(relationship) {
    this.setDependent(relationship, relationship.deps.map(this.getProperty.bind(this)));
  }
};
if(typeof module !== 'undefined' && module.exports) {
  module.exports = Mapper;
}