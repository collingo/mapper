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
	},
	processMap: function() {
		Object.keys(this.map)
			.forEach(this.processMapping.bind(this));
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
	setProperty: function(property, value) {
		this.viewModel[property] = value;
		this.updatePropertyInView(property, value);
	},
	updatePropertyInView: function(property, value) {
		$('[data='+property+']').text(value);
	},
	registerDependency: function(relationship, dependency) {
		if(!this.dependencyMap[dependency]) {
			this.dependencyMap[dependency] = [];
		}
		this.dependencyMap[dependency].push(relationship);
	},
	processCalculatedProperties: function() {
		var processed = [];
		Object.keys(this.dependencyMap)
			.forEach(this.processDependency.bind(this, processed));
	},
	processDependency: function(processed, dep) {
		this.dependencyMap[dep].forEach(this.processDependencyRelationship.bind(this, processed));
	},
	processDependencyRelationship: function(processed, relationship) {
		var sig = relationship.prop;
		if(processed.indexOf(sig) < 0) {
			this.updateDependency(relationship);
			processed.push(sig);
		}
	},
	updateDependency: function(relationship) {
		$.when.apply($.when, relationship.deps.map(this.store.once.bind(this.store)))
			.done(this.applyDependency.bind(this, relationship));
	},
	applyDependency: function(relationship) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		this.viewModel[relationship.prop] = relationship.cb.apply(this, args);
		this.updatePropertyInView(relationship.prop, this.viewModel[relationship.prop]);
	},
	bind: function() {
		this.store.onChange(this.onChange.bind(this));
		Object.observe(this.viewModel, this.onViewModelChange.bind(this));
	},
	onChange: function(name, value) {
		this.viewModel[name] = value;
	},
	onViewModelChange: function(changes) {
		var processed = [];
		changes.forEach(this.processViewModelChange.bind(this, processed));
	},
	processViewModelChange: function(processed, change) {
		var prop = change.name;
		if(this.dependencyMap[prop]) {
			this.dependencyMap[prop].forEach(this.processDependencyRelationship.bind(this, processed));
		}
		this.updatePropertyInView(prop, this.viewModel[prop]);
	}
};
if(typeof module !== 'undefined' && module.exports) {
  module.exports = Mapper;
}