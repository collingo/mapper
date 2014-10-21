'use strict';
var proxyquire = require('proxyquire');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

describe('mapper', function() {

  var sandbox;
  var callback;
  var store;
  var observer;
  var Mapper;
  var mapper;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    store = {
      onChange: sandbox.spy()
    };
    observer = sandbox.spy();
    Mapper = proxyquire('../src/mapper', {
      observer: observer
    });
    mapper = new Mapper(store, {});
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('when initialising', function() {

    beforeEach(function() {
      mapper.init();
    });

    it('should bind to change events from the store', function() {
      expect(store.onChange).to.be.have.been.calledOnce
    });

    it('should bind to changes on the map', function() {
      expect(observer).to.be.have.been.calledOnce
    });

  });
  
});