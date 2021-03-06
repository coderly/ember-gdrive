import Ember from 'ember';
import DS from 'ember-data';
import uuid from 'ember-gdrive/lib/uuid';
import ChangeObserver from 'ember-gdrive/lib/change-observer';

import { modelKey } from 'ember-gdrive/lib/util';

var Adapter = DS.Adapter.extend({
  defaultSerializer: '-google-drive',

  documentSource: null,
  document: Ember.computed.alias('documentSource.document'),
  namespace: 'v1',


  ref: function() {
    var ref = this.get('document.ref'),
        namespace = this.get('namespace');

    return ref.get(namespace).materialize();
  }.property('document.ref', 'namespace'),

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

  recordCreatedLocally: function(store, typeKey, data, event) {
    store.push(typeKey, data);
  },
  recordUpdatedLocally: function(store, typeKey, data) {
    store.push(typeKey, data);
  },
  recordDeletedLocally: function(store, typeKey, id) {
    var deletedRecord = store.getById(typeKey, id);
    if (deletedRecord && !deletedRecord.get('isDeleted')) {
      deletedRecord.destroyRecord();
    }
  },

  changeObserver: function() {
    return ChangeObserver.create({ ref: this.get('ref'), target: this });
  }.property(),

  observeRecordData: function(store, typeKey, id) {
    return this.get('changeObserver').observeRecordData(store, typeKey, id);
  },

  observeIdentityMap: function(store, typeKey) {
    return this.get('changeObserver').observeIdentityMap(store, typeKey);
  },

  generateIdForRecord: function(store, inputProperties) {
    return uuid();
  },

  find: function(store, type, id) {
    this.observeRecordData(store, type.typeKey, id);
    return Ember.RSVP.resolve(this.get('ref').get(modelKey(type), id).value());
  },

  createRecord: function(store, type, snapshot) {
    var record = snapshot.record,
        serializedRecord = record.serialize({includeId: true}),
        id = record.get('id'),
        ref = this.get('ref');

    this.beginSave('createRecord');
    ref.get(modelKey(type), id).set(serializedRecord);
    this.endSave('createRecord');

    this.observeRecordData(store, type.typeKey, id);

    return Ember.RSVP.resolve(this.get('ref').get(modelKey(type), id).value());
  },

  updateRecord: function(store, type, snapshot) {
    var record = snapshot.record,
        serializedRecord = record.serialize({includeId: true}),
        id = record.get('id'),
        ref = this.get('ref');

    this.beginSave('updateRecord');
    ref.get(modelKey(type), id).set(serializedRecord);
    this.endSave('updateRecord');

    this.observeRecordData(store, type.typeKey, id);

    return Ember.RSVP.resolve(ref.get(modelKey(type), id).value());
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

  deleteRecord: function(store, type, snapshot) {
    var record = snapshot.record,
        ref = this.get('ref'),
        id = record.get('id');
    ref.get(modelKey(type)).delete(id);
    return Ember.RSVP.resolve();
  },

  undo: function() {
    this.get('document').undo();
  },

  redo: function() {
    this.get('document').redo();
  },

  beginSave: function(name) {
    this.get('document').beginSave(name);
  },

  endSave: function(name) {
    this.get('document').endSave(name);
  }
});

export default Adapter;