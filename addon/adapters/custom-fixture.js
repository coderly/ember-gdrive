import Ember from 'ember';
import DS from 'ember-data';

export default DS.FixtureAdapter.extend({
  simulateRemoteResponse: false, // TODO have to turn this back on
  defaultSerializer: '-google-drive',
  fixturesForType: function(type) {
    if (!type.FIXTURES) {
      type.FIXTURES = [];
		}
    return this._super(type);
  },
  createRecord: function(store, type, record) {
    var adapter = this;
    return this._loadRelationships(record).then(function() {
      return adapter._super(store, type, record);
    });
  },
  updateRecord: function(store, type, record) {
    var adapter = this;
    return this._loadRelationships(record).then(function() {
      return adapter._super(store, type, record);
    });
  },
  deleteRecord: function(store, type, record) {
    var adapter = this;
    return this._loadRelationships(record).then(function() {
      return adapter._super(store, type, record);
    });
  },
  _loadRelationships: function(record) {
    var relationshipPromises = {};

    record.eachRelationship(function(key, _) {
      relationshipPromises[key] = record.get(key);
    });

    return Ember.RSVP.hash(relationshipPromises);
  },
  beginSave: function() {
  },
  endSave: function() {
  },
  beginOperation: function() {
  },
  endOperation: function() {
  },
  toString: function() {
    return 'CustomFixtureAdapter: ' + this._super();
  }
});