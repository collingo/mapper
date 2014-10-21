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

  describe('when initialised', function() {

    it('should set one to one mappings', function(done) {
      var mapper = new Mapper(store, mapOneToOne);
      var viewModel = mapper.init();
      setTimeout(function() {
        expect(viewModel.forename).to.equal('John');
        done();
      }, 0);
    });

    it('should set dependent mappings', function(done) {
      var mapper = new Mapper(store, mapDependency);
      var viewModel = mapper.init();
      setTimeout(function() {
        expect(viewModel.fullname).to.equal('John Smith');
        done();
      }, 0);
    });

    it('should allow multiple dependent mappings on one property', function(done) {
      var mapper = new Mapper(store, mapMultiDependency);
      var viewModel = mapper.init();
      setTimeout(function() {
        expect(viewModel.message).to.equal('Hello John');
        done();
      }, 0);
    });

    it('should allow nested dependency mappings', function(done) {
      var mapper = new Mapper(store, mapNestedDependency);
      var viewModel = mapper.init();
      setTimeout(function() {
        expect(viewModel.message).to.equal('Hello John Smith');
        done();
      }, 0);
    });

  });
  
  describe('when data changes in the store', function() {

    it('should update one to one mappings directly', function(done) {
      var mapper = new Mapper(store, mapOneToOne);
      var viewModel = mapper.init();
      setTimeout(function() {
        storeOnChange('forename', 'Tom');
        expect(viewModel.forename).to.equal('Tom');
        done();
      }, 0);
    });

    it('should update dependent mappings', function(done) {
      var mapper = new Mapper(store, mapDependency);
      var viewModel = mapper.init();
      setTimeout(function() {
        storeOnChange('forename', 'Tom');
        setTimeout(function() {
          expect(viewModel.fullname).to.equal('Tom Smith');
          done();
        }, 0);
      }, 0);
    });

    it('should update multiple dependent mappings', function(done) {
      var mapper = new Mapper(store, mapMultiDependency);
      var viewModel = mapper.init();
      setTimeout(function() {
        storeOnChange('forename', 'Tom');
        setTimeout(function() {
          expect(viewModel.message).to.equal('Hello Tom');
          done();
        }, 0);
      }, 0);
    });

    it('should update nested dependency mappings', function(done) {
      var mapper = new Mapper(store, mapNestedDependency);
      var viewModel = mapper.init();
      setTimeout(function() {
        storeOnChange('forename', 'Tom');
        setTimeout(function() {
          expect(viewModel.message).to.equal('Hello Tom Smith');
          done();
        }, 0);
      }, 0);
    });

  });
  
});