"use strict";
var uuid = require("./uuid")["default"];
var Document = require("./document")["default"];
var ChangeObserver = require("./change-observer")["default"];

var modelKey = require("./util").modelKey;

var Adapter = DS.Adapter.extend(Ember.ActionHandler, {
  defaultSerializer: '-google-drive',

  documentSource: null,
  document: Ember.computed.alias('documentSource.document'),
  ref: Ember.computed.alias('document.ref'),

  unresolvedLocalChanges: 0,

  _actions: {
    recordCreatedRemotely: function(store, typeKey, data) {
      store.push(typeKey, data);
    },
    recordUpdatedRemotely: function(store, typeKey, data) {
      store.push(typeKey, data);
    },
    recordDeletedRemotely: function(store, typeKey, id) {
      var deletedRecord = store.getById(typeKey, id);
      store.unloadRecord(deletedRecord);
    },

    recordCreatedLocally: function(store, typeKey, data) {
      if (this.get('unresolvedLocalChanges') > 0) {
        store.push(typeKey, data);
        this.decrementProperty('unresolvedLocalChanges');
      }
    },
    recordUpdatedLocally: function(store, typeKey, data, e) {
      if (this.get('unresolvedLocalChanges') > 0) {
        store.push(typeKey, data);
        this.decrementProperty('unresolvedLocalChanges');
      }
    },
    recordDeletedLocally: function(store, typeKey, id) {
      if (this.get('unresolvedLocalChanges') > 0) {
        var deletedRecord = store.getById(typeKey, id);
        store.unloadRecord(deletedRecord);
        this.decrementProperty('unresolvedLocalChanges');
      }
    }
  },

  changeObserver: function() {
    return ChangeObserver.create({ ref: this.get('ref'), target: this });
  }.property(),

  observeRecordData: function(store, typeKey, id) {
    return this.get('changeObserver').observeRecordData(store, typeKey, id)
  },

  observeIdentityMap: function(store, typeKey) {
    return this.get('changeObserver').observeIdentityMap(store, typeKey)
  },

  generateIdForRecord: function(store, record) {
    return uuid();
  },

  find: function(store, type, id) {
    this.observeRecordData(store, type.typeKey, id);
    return Ember.RSVP.resolve( this.get('ref').get(modelKey(type), id).value() );
  },

  createRecord: function(store, type, record) {
    var serializedRecord = record.serialize({includeId: true}),
        id = record.get('id'),
        ref = this.get('ref');

    this.beginSave();
    ref.get(modelKey(type), id).set(serializedRecord);
    this.endSave();

    this.observeRecordData(store, type.typeKey, id);

    return Ember.RSVP.resolve( this.get('ref').get(modelKey(type), id).value() );
  },

  updateRecord: function(store, type, record) {
    var serializedRecord = record.serialize({includeId: true}),
        id = record.get('id'),
        ref = this.get('ref');

    this.beginSave();
    ref.get(modelKey(type), id).set(serializedRecord);
    this.endSave();

    this.observeRecordData(store, type.typeKey, id);

    return Ember.RSVP.resolve( ref.get(modelKey(type), id).value() );
  },

  findAll: function(store, type) {
    var adapter = this,
        ref = this.get('ref'),
        identityMap = ref.get(modelKey(type)).value() || {},
        keys = ref.get(modelKey(type)).keys(),
        serializedRecords = [];

    for (var i = 0; i < keys.length; i++) {
      serializedRecords.push( identityMap[ keys[i] ] );
    }

    this.observeIdentityMap(store, type.typeKey);

    serializedRecords.forEach(function(data) {
      adapter.observeRecordData(store, type.typeKey, data.id);
    });

    return Ember.RSVP.resolve( serializedRecords );
  },

  deleteRecord: function(store, type, record) {
    var ref = this.get('ref');
    var id = record.get('id');
    ref.get(modelKey(type)).delete(id);
    return Ember.RSVP.resolve();
  },

  undo: function() {
    this.incrementProperty('unresolvedLocalChanges');
    this.get('document').undo();
  },

  redo: function() {
    this.incrementProperty('unresolvedLocalChanges');
    this.get('document').redo();
  },

  beginSave: function(name) {
    this.get('document').beginSave(name);
  },

  endSave: function() {
    this.get('document').endSave();
  }
});

exports["default"] = Adapter;