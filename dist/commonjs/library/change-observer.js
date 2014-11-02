"use strict";
var normalizeTypeKey = require("./util").normalizeTypeKey;

var pluck = require("./util").pluck;


function logEventToConsole(e) {
  console.log({
    type: e.type,
    property: e.property,
    oldValue: e.oldValue,
    newValue: e.newValue,
    isLocal: e.isLocal,
    bubbles: e.bubbles,
    sessionId: e.sessionId,
    userId: e.userId
  });
}

function logEventToBlackHole(e) {}

var logEvent = logEventToBlackHole;

exports["default"] = Ember.Object.extend(Ember.ActionHandler, {
  ref: null,
  target: null,
  observedMap: function() { return {} }.property(),

  observeRecordData: function(store, typeKey, id) {
    var observer = this,
        observedMap = this.get('observedMap'),
        key = [normalizeTypeKey(typeKey), id].join('/'),
        ref = this.get('ref');

    if (observedMap[key]) {
      return Ember.RSVP.Promise.resolve();
    }
    else {
      observedMap[key] = true; // can set this to the promise and return that every time
    }

    ref.get(normalizeTypeKey(typeKey), id).changed(function(e) {
      if (e.type == 'value_changed') {
        Ember.run(function(){
          observer.recordDataChanged(store, typeKey, id, e);
        });
      }
    });
  },

  observeIdentityMap: function(store, typeKey) {
    var observer = this,
        observedMap = this.get('observedMap'),
        key = [normalizeTypeKey(typeKey)].join('/'),
        ref = this.get('ref');

    if (observedMap[key]) {
      return Ember.RSVP.Promise.resolve();
    }
    else {
      observedMap[key] = true;
    }

    ref.get(normalizeTypeKey(typeKey)).materialize().changed(function(e) {
      if (e.type == 'value_changed') {
        Ember.run.once(observer, 'identityMapChanged', store, typeKey, e);
      }
    });
  },

  recordDataChanged: function(store, typeKey, id, e) {
    logEvent(e);

    var ref = this.get('ref');
    var data = ref.get(normalizeTypeKey(typeKey), id).value();

    // if a record is getting deleted its attributes will all get set to null
    // shouldn't be raising update events after a record gets deleted
    if (!data) {
      return;
    }

    if (e.isLocal) {
      this.get('target').recordUpdatedLocally(store, typeKey, data);
    }
    else {
      this.get('target').recordUpdatedRemotely(store, typeKey, data);
    }
  },

  identityMapChanged: function(store, typeKey, e) {
    logEvent(e);

    var ref = this.get('ref');
    var data, newRecordId;


    if (e.isLocal && e.oldValue == null && e.newValue) {
      newRecordId = e.newValue.get('id');
      data = ref.get(normalizeTypeKey(typeKey), newRecordId).value();
      this.get('target').recordCreatedLocally(store, typeKey, data);
    }

    else if (e.isLocal && e.oldValue && e.newValue == null) {
      this.get('target').recordDeletedLocally(store, typeKey, e.oldValue.get('id'));
    }

    else if (!e.isLocal && e.oldValue == null && e.newValue) {
      newRecordId = e.newValue.get('id');
      data = ref.get(normalizeTypeKey(typeKey), newRecordId).value();

      this.get('target').recordCreatedRemotely(store, typeKey, data);
    }

    else if (!e.isLocal && e.oldValue && e.newValue == null) {
      var deletedRecordId = e.oldValue.get('id');
      this.get('target').recordDeletedRemotely(store, typeKey, deletedRecordId);
    }
  }

});