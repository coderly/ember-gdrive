import { normalizeTypeKey } from './util';
import { pluck } from './util';

export default Ember.Object.extend(Ember.ActionHandler, {
  ref: null,
  target: null,
  observedMap: function() { return {} }.property(),

  observeRecordData: function(store, typeKey, id) {
    var observer = this,
        observedMap = this.get('observedMap'),
        key = [normalizeTypeKey(typeKey), id].join('/'),
        ref = this.get('ref');

    if (this.contains(key)) {
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

    if (this.contains(key)) {
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

  contains: function(key) {
    var observedMap = this.get('observedMap');
    return observedMap[key];
  },

  recordDataChanged: function(store, typeKey, id, e) {
    var ref = this.get('ref');
    if (e.isLocal) {
      var data = ref.get(normalizeTypeKey(typeKey), id).value();
      this.send('recordUpdatedLocally', store, typeKey, data);
    }
    else {
      var data = ref.get(normalizeTypeKey(typeKey), id).value();
      this.send('recordUpdatedRemotely', store, typeKey, data);
    }
  },

  identityMapChanged: function(store, typeKey, e) {
    var ref = this.get('ref');

    if (e.isLocal && e.oldValue == null && e.newValue) {
      this.send('recordCreatedLocally', store, typeKey, e.newValue.get('id'));
    }

    else if (e.isLocal && e.oldValue && e.newValue == null) {
      this.send('recordDeletedLocally', store, typeKey, e.oldValue.get('id'));
    }

    else if (!e.isLocal && e.oldValue == null && e.newValue) {
      var newRecordId = e.newValue.get('id'),
          data = ref.get(normalizeTypeKey(typeKey), newRecordId).value();

      this.send('recordCreatedRemotely', store, typeKey, data);
    }

    else if (!e.isLocal && e.oldValue && e.newValue == null) {
      var deletedRecordId = e.oldValue.get('id');
      this.send('recordDeletedRemotely', store, typeKey, deletedRecordId);
    }
  }

});
