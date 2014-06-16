import uuid from './uuid';
import Document from './document';
import ChangeObserver from './change-observer';

import { modelKey } from './util';

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

  ref: function() {
    return this.get('documentPromise').then(function(document) {
      document.ref().then(function(r) { window.ref = r; });
      return document.ref();
    });
  }.property().readOnly(),

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
    var adapter = this;
    return this.get('ref').then(function(ref) {
      adapter.observeRecordData(store, type.typeKey, id);
      return ref.get(modelKey(type), id).value();
    });
  },

  createRecord: function(store, type, record) {
    var adapter = this;

    return this.get('ref').then(function(ref) {
      var serializedRecord = record.serialize({includeId: true}),
          id = record.get('id');

      adapter.beginSave();
      ref.get(modelKey(type), id).set(serializedRecord);
      adapter.endSave();

      adapter.observeRecordData(store, type.typeKey, id);

      return ref.get(modelKey(type), id).value();
    });
  },

  updateRecord: function(store, type, record) {
    var adapter = this;
    return this.get('ref').then(function(ref) {
      var serializedRecord = record.serialize({includeId: true}),
          id = record.get('id');

      adapter.beginSave();
      ref.get(modelKey(type), id).set(serializedRecord);
      adapter.endSave();

      adapter.observeRecordData(store, type.typeKey, id);

      return ref.get(modelKey(type), id).value();
    });
  },

  findAll: function(store, type) {
    var adapter = this;

    return this.get('ref').then(function(ref) {
      var identityMap = ref.get(modelKey(type)).value() || {};
      var keys = ref.get(modelKey(type)).keys();
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
    return this.get('ref').then(function(ref) {
      var id = record.get('id');
      ref.get(modelKey(type)).delete(id);
    });
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

export default Adapter;