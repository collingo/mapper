var Q = require('q');

function Mapper(store, map, updateable) {
  this.store = store;
  this.map = map;
  this.viewModel = {};
  this.dependencyMap = {};
  if(updateable) {
    this.bind();
  }
}
Mapper.prototype = {
  constructor: Mapper,
  getViewModel: function() {
    return this.initMap().then(this.initDependants.bind(this));
  },
  initMap: function() {
    return Q.all(Object.keys(this.map).map(this.initMapping.bind(this)));
  },
  initMapping: function(property) {
    var mapping = this.map[property];
    var deferred = Q.defer();
    if(typeof mapping === 'string') {
      this.store.once(property).then(function(property, value) {
        this.setOnViewModel(property, value);
        deferred.resolve();
      }.bind(this, property));
    } else {
      var callback = mapping.pop();
      mapping.forEach(this.registerDependency.bind(this, {
        prop: property,
        cb: callback,
        deps: mapping
      }));
      deferred.resolve();
    }
    return deferred.promise;
  },
  getFromViewModel: function(path) {
    return this.viewModel[path];
  },
  setOnViewModel: function(path, value) {
    this.viewModel[path] = value;
    if(this.dependencyMap[path]) {
      this.dependencyMap[path].forEach(this.setDependent.bind(this));
    }
  },
  registerDependency: function(relationship, dependency) {
    if(!this.dependencyMap[dependency]) {
      this.dependencyMap[dependency] = [];
    }
    this.dependencyMap[dependency].push(relationship);
  },
  initDependants: function() {
    var processed = [];
    Object.keys(this.dependencyMap).forEach(this.processDependency.bind(this, processed));
    return this.viewModel;
  },
  processDependency: function(processed, dep) {
    this.dependencyMap[dep].forEach(this.processDependencyRelationship.bind(this, processed));
  },
  processDependencyRelationship: function(processed, relationship) {
    var sig = relationship.prop;
    if(processed.indexOf(sig) < 0) {
      this.setDependent(relationship);
      processed.push(sig);
    }
  },
  setDependent: function(relationship) {
    this.setOnViewModel(relationship.prop, relationship.cb.apply(this, relationship.deps.map(this.getFromViewModel.bind(this))));
  },
  bind: function() {
    this.store.onChange(this.onStoreChange.bind(this));
  },
  onStoreChange: function(path, value) {
    this.setOnViewModel(path, value);
  },
  onViewModelChange: function(path, type, oldValue, newValue) {
    if(this.dependencyMap[path]) {
      this.dependencyMap[path].forEach(this.setDependent.bind(this));
    }
  }
};

module.exports = Mapper;