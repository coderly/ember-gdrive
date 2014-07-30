import Reference from './reference';

var Document = Ember.Object.extend(Ember.Evented, {
  id: null,
  content: null,
  title: Ember.computed.alias('meta.title'),

  init: function(googleDocument, documentId) {
    Ember.assert('You must pass in a valid google document.', !!googleDocument);

    this.set('content', googleDocument);
    this.set('id', documentId);

    this._loadMeta();
  },

  ref: function() {
    return new Reference(
      this.get('model'),
      null,
      null,
      this.get('root')
    );
  }.property('model', 'root').readOnly(),

  root: function() {
    return this.get('model').getRoot();
  }.property('model').readOnly(),

  model: function() {
    return this.get('content').getModel();
  }.property('content').readOnly(),

  meta: {},

  openSaveCount: 0,

  /* undo/redo */

  beginSave: function(name) {
    this.get('model').beginCompoundOperation();
    this.incrementProperty('openSaveCount');
  },

  endSave: function(name) {
    this.get('model').endCompoundOperation();
    this.decrementProperty('openSaveCount');
  },

  undo: function() {
    if (this.canUndo()) {
      this.get('model').undo();
    }
  },

  redo: function() {
    if (this.canRedo()) {
      this.get('model').redo();
    }
  },

  canUndo: function() {
    return this.get('model').canUndo;
  },

  canRedo: function() {
    return this.get('model').canRedo;
  },

  _loadMeta: function() {
    var document = this;
    this._fetchMeta(this.get('id')).then(function(meta) {
      document.set('meta', meta);
    });
  },

  _fetchMeta: function(documentId) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      gapi.client.drive.files.get({fileId: documentId}).execute(function(googleFileMeta) {
        if (googleFileMeta.error) {
          reject(googleFileMeta);
        }
        else {
          resolve( googleFileMeta );
        }
      });
    });
  }

});

var loadPromises = {};

Document.reopenClass({
  find: function(documentId) {
    if (loadPromises[documentId])
      return loadPromises[documentId];

    loadPromises[documentId] = new Ember.RSVP.Promise(function(resolve, reject){
      gapi.drive.realtime.load(documentId,
        function(d) { Ember.run(null, resolve, d); },
        Ember.K,
        function(e) { Ember.run(null, reject, e); }
      );
    }).then(function(googleDocument) {
        return new Document(googleDocument, documentId);
      }, function(e) {
        delete loadPromises[documentId]; // don't store error promises so they can be retried
          console.log('oh my, gonna make an error');

        if(e.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
          throw new Error('Token refresh required');
        } else if(e.type == gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
          throw new Error("An Error happened: " + e.message);
        } else if(e.type == gapi.drive.realtime.ErrorType.NOT_FOUND) {
          throw new Error("The file was not found. It does not exist or you do not have read access to the file.");
        }
        else {
          throw new Error("Unknown error occured'")
        }
      });

    return loadPromises[documentId];
  },
  create: function(params) {
    return this._sendCreateRequest(params).then(function(googleFile) {
      if (googleFile.error) {
        return Ember.RSVP.reject(new Error(googleFile.error.message));
      }
      else {
        return Document.find(googleFile.id);
      }
    });
  },
  _sendCreateRequest: function(params) {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      gapi.client.drive.files.insert({
        'resource': {
          mimeType: ENV.GOOGLE_MIME_TYPE,
          title: Ember.get(params, 'title')
        }
      }).execute(function(d){ Ember.run(null, resolve, d); });
    });
  }
});

export default Document;
