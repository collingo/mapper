'use strict';
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Q = require('q');
var expect = chai.expect;
chai.use(sinonChai);

var sandbox;
var viewModel;
var store;
var mapOneToOne;
var mapDependency;
var mapMultiDependency;
var mapNestedDependency;
var mapper;
var promiseCache;
var storeOnChange;
var data = {
  forename: 'John',
  surname: 'Smith'
};

//// SUT
var Mapper = require('../src/mapper');

describe('mapper', function() {

  var map;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    promiseCache = {};
    store = {
      once: sandbox.spy(function(prop) {
        var deferred = Q.defer();
        promiseCache[prop] = {
          resolve: function(result) {
            deferred.resolve(result || data[prop]);
          }
        };
        promiseCache[prop].resolve();
        return deferred.promise;
      }),
      onChange: sandbox.spy(function(cb) {
        storeOnChange = cb;
      })
    };
    mapOneToOne = {
      forename: 'forename'
    };
    mapDependency = {
      forename: 'forename',
      surname: 'surname',
      fullname: ['forename', 'surname', function(forename, surname) {
        return forename + ' ' + surname;
      }]
    };
    mapMultiDependency = {
      forename: 'forename',
      surname: 'surname',
      fullname: ['forename', 'surname', function(forename, surname) {
        return forename + ' ' + surname;
      }],
      message: ['forename', function(forename) {
        return 'Hello ' + forename;
      }]
    };
    mapNestedDependency = {
      forename: 'forename',
      surname: 'surname',
      fullname: ['forename', 'surname', function(forename, surname) {
        return forename + ' ' + surname;
      }],
      message: ['fullname', function(fullname) {
        return 'Hello ' + fullname;
      }]
    };
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('when getViewModel resolves', function() {

    it('should set one to one mappings', function(done) {
      var mapper = new Mapper(store, mapOneToOne);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        expect(viewModel.forename).to.equal('John');
        done();
      });
    });

    it('should set dependent mappings', function(done) {
      var mapper = new Mapper(store, mapDependency);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        expect(viewModel.fullname).to.equal('John Smith');
        done();
      });
    });

    it('should allow multiple dependent mappings on one property', function(done) {
      var mapper = new Mapper(store, mapMultiDependency);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        expect(viewModel.message).to.equal('Hello John');
        done();
      });
    });

    it('should allow nested dependency mappings', function(done) {
      var mapper = new Mapper(store, mapNestedDependency);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        expect(viewModel.message).to.equal('Hello John Smith');
        done();
      });
    });

  });
  
  describe('when data changes in the store', function() {

    it('should update one to one mappings directly', function(done) {
      var mapper = new Mapper(store, mapOneToOne, true);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        storeOnChange('forename', 'Tom');
        expect(viewModel.forename).to.equal('Tom');
        done();
      });
    });

    it('should update dependent mappings', function(done) {
      var mapper = new Mapper(store, mapDependency, true);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        storeOnChange('forename', 'Tom');
        expect(viewModel.fullname).to.equal('Tom Smith');
        done();
      });
    });

    it('should update multiple dependent mappings', function(done) {
      var mapper = new Mapper(store, mapMultiDependency, true);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        storeOnChange('forename', 'Tom');
        expect(viewModel.message).to.equal('Hello Tom');
        done();
      });
    });

    it('should update nested dependency mappings', function(done) {
      var mapper = new Mapper(store, mapNestedDependency, true);
      var viewModelPromise = mapper.getViewModel();
      viewModelPromise.then(function(viewModel) {
        storeOnChange('forename', 'Tom');
        expect(viewModel.message).to.equal('Hello Tom Smith');
        done();
      });
    });

  });
  
});