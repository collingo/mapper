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
    return this.initMap()
            .then(this.initDependants.bind(this))
            .then(function() {
              return this.viewModel;
            }.bind(this));
  },
  initMap: function() {
    return Q.all(Object.keys(this.map).map(this.initMapping.bind(this)));
  },
  initMapping: function(path) {
    var mapping = this.map[path];
    if(typeof mapping === 'string') {
      return this.store.once(path).then(this.setOnViewModel.bind(this, path));
    } else {
      this.registerDependencies(path, mapping);
      return Q();
    }
  },
  getFromViewModel: function(path) {
    return this.viewModel[path];
  },
  setOnViewModel: function(path, value) {
    this.viewModel[path] = value;
    this.updateDependantsFor(path);
  },
  updateDependantsFor: function(path) {
    if(this.dependencyMap[path]) {
      this.dependencyMap[path].forEach(this.setDependent.bind(this));
    }
  },
  registerDependencies: function(path, mapping) {
    var callback = mapping.pop();
    mapping.forEach(this.registerDependency.bind(this, {
      prop: path,
      cb: callback,
      deps: mapping
    }));
  },
  registerDependency: function(relationship, dependency) {
    if(!this.dependencyMap[dependency]) {
      this.dependencyMap[dependency] = [];
    }
    this.dependencyMap[dependency].push(relationship);
  },
  initDependants: function() {
    Object.keys(this.dependencyMap).forEach(this.processDependency.bind(this));
  },
  processDependency: function(dep) {
    this.dependencyMap[dep].forEach(this.setDependent.bind(this));
  },
  setDependent: function(relationship) {
    this.setOnViewModel(relationship.prop, relationship.cb.apply(this, relationship.deps.map(this.getFromViewModel.bind(this))));
  },
  bind: function() {
    this.store.onChange(this.onStoreChange.bind(this));
  },
  onStoreChange: function(path, value) {
    this.setOnViewModel(path, value);
  }
};

module.exports = Mapper;