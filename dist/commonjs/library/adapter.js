"use strict";
var uuid = require("./uuid")["default"];
var Document = require("./document")["default"];
var ChangeObserver = require("./change-observer")["default"];

var Adapter = DS.Adapter.extend(Ember.ActionHandler, {

  init: function() {
    this._super();
  },

  documentSource: null,
  documentId: Ember.computed.alias('documentSource.id'),

  defaultSerializer: '-google-drive',

  documentPromise: function() {
    var adapter = this;
    Ember.assert('A document id was not assigned. Make sure you set a document ' +
                 'id in a route before the store is accessed', this.get('documentId'));

    return Document.find( this.get('documentId') ).then(function(doc) {
      adapter.set('document', doc);
      return doc;
    });

  }.property('documentId'),

  document: null,

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
    recordUpdatedLocally: function(store, typeKey, data) {
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

  ref: function() {
    return this.get('documentPromise').then(function(document) {
      document.ref().then(function(r) { window.ref = r; });
      return document.ref();
    });
  },

  changeObserver: function() {
    return ChangeObserver.create({ ref: this.ref(), target: this });
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
    var adapter = this;
    return this.ref().then(function(ref) {
      adapter.observeRecordData(store, type.typeKey, id);
      return ref.get(type.typeKey, id).value();
    });
  },

  createRecord: function(store, type, record) {
    var adapter = this;

    return this.ref().then(function(ref) {
      var serializedRecord = record.serialize({includeId: true}),
          id = record.get('id');

      ref.begin();
      ref.get(type.typeKey, id).set(serializedRecord);
      ref.end();

      adapter.observeRecordData(store, type.typeKey, id);

      return ref.get(type.typeKey, id).value();
    });
  },

  updateRecord: function(store, type, record) {
    var adapter = this;
    return this.ref().then(function(ref) {
      var serializedRecord = record.serialize({includeId: true}),
          id = record.get('id');

      ref.begin();
      ref.get(type.typeKey, id).set(serializedRecord);
      ref.end();

      adapter.observeRecordData(store, type.typeKey, id);

      return ref.get(type.typeKey, id).value();
    });
  },

  findAll: function(store, type) {
    var adapter = this;

    return this.ref().then(function(ref) {
      var identityMap = ref.get(type.typeKey).value() || {};
      var keys = ref.get(type.typeKey).keys();
      var serializedRecords = [];

      for (var i = 0; i < keys.length; i++) {
        serializedRecords.push( identityMap[ keys[i] ] );
      }

      adapter.observeIdentityMap(store, type.typeKey);

      serializedRecords.forEach(function(data) {
        adapter.observeRecordData(store, type.typeKey, data.id);
      });

      return serializedRecords;
    });
  },

  deleteRecord: function(store, type, record) {
    return this.ref().then(function(ref) {
      var id = record.get('id');
      ref.get(type.typeKey).delete(id);
    });
  },

  undo: function() {
    console.log('undo sonnownownfwonwefonwo yeah hoyoyoyoy o');
    this.incrementProperty('unresolvedLocalChanges');
    this.get('document').undo();
  },

  redo: function() {
    console.log('redo sonsdfsdfdfnn');
    this.incrementProperty('unresolvedLocalChanges');
    this.get('document').redo();
  }

});

exports["default"] = Adapter;