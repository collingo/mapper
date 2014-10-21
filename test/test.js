'use strict';
var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Q = require('q');
var expect = chai.expect;
chai.use(sinonChai);

var sandbox;
var viewModel;
var store;
var map;
var observer;
var Mapper;
var mapper;
var onChangeCallback;
var data = {
  name: 'Nick'
};

//// SUT
function givenAMapper(store, map) {
  observer = sandbox.spy();
  Mapper = proxyquire('../src/mapper', {
    observer: observer
  });
  mapper = new Mapper(store, map);
}

describe('mapper', function() {

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    store = {
      once: sandbox.spy(function(prop) {
        return Q(data[prop]);
      }),
      onChange: sandbox.spy(function(cb) {
        onChangeCallback = cb;
      })
    };
    map = {
      name: 'name'
    };
    givenAMapper(store, map);
    viewModel = mapper.init();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('when initialising the viewModel', function() {

    it('should treat strings as paths to data in the store', function() {
      expect(viewModel.name).to.equal('Nick');
    });

  });
  
  describe('when data changes in the store', function() {

    it('should update the viewModel with the new data', function() {
      onChangeCallback('name', 'John');
      expect(viewModel.name).to.equal('John');
    });

  });
  
});