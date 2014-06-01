export default Ember.Object.extend(Ember.ActionHandler, {
  ref: null,
  target: null,
  observedMap: function() { return {} }.property(),

  observeRecordData: function(store, typeKey, id) {
    var observer = this,
        observedMap = this.get('observedMap'),
        key = [typeKey, id].join('/');

    if (this.contains(key)) {
      return Ember.RSVP.Promise.resolve();
    }
    else {
      observedMap[key] = true;
    }

    return this.get('ref').then(function(ref) {
      ref.get(typeKey, id).changed(function(e) {
        if (e.type == 'object_changed')
          Ember.run.once(observer, 'recordDataChanged', store, typeKey, id, e);
      });
    });
  },

  observeIdentityMap: function(store, typeKey) {
    var observer = this,
      observedMap = this.get('observedMap'),
      key = [typeKey].join('/');

    if (this.contains(key)) {
      return Ember.RSVP.Promise.resolve();
    }
    else {
      observedMap[key] = true;
    }

    return this.get('ref').then(function(ref) {
      ref.get(typeKey).materialize().changed(function(e) {
        if (!e.isLocal) {
          window.vals.push(e);
        }

        if (e.type == 'value_changed')
          Ember.run.once(observer, 'identityMapChanged', store, typeKey, e);
      });
    });

  },

  contains: function(key) {
    var observedMap = this.get('observedMap');
    return observedMap[key];
  },

  recordDataChanged: function(store, typeKey, id, e) {
    if (e.isLocal) {
      var observer = this;
      this.get('ref').then(function(ref) {
        var data = ref.get(typeKey, id).value();
        observer.send('recordUpdatedLocally', store, typeKey, data);
      });
    }
    else {
      var observer = this;
      this.get('ref').then(function(ref) {
        var data = ref.get(typeKey, id).value();
        observer.send('recordUpdatedRemotely', store, typeKey, data);
      });
    }
  },

  identityMapChanged: function(store, typeKey, e) {
    var observer = this;

    if (e.isLocal && e.oldValue == null && e.newValue) {
      this.send('recordCreatedLocally', store ,typeKey, e.newValue.get('id'));
    }
    else if (e.isLocal && e.oldValue && e.newValue == null) {
      this.send('recordDeletedLocally', store, typeKey, e.oldValue.get('id'));
    }
    else if (!e.isLocal && e.oldValue == null && e.newValue) {
      var newRecordId = e.newValue.get('id');
      this.get('ref').then(function(ref) {
        var data = ref.get(typeKey, newRecordId).value();
        observer.send('recordCreatedRemotely', store, typeKey, data);
      });
    }
    else if (!e.isLocal && e.oldValue && e.newValue == null) {
      var deletedRecordId = e.oldValue.get('id');
      this.send('recordDeletedRemotely', store, typeKey, deletedRecordId);
    }
  }

});
