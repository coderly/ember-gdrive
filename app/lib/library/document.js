import Reference from './reference';

var Document = Ember.Object.extend(Ember.Evented, {
  id: null,
  content: null,
  title: Ember.computed.alias('meta.title'),

  hasUnsavedChanges: false,
  isSaving: false,

  canUndo: false,
  canRedo: false,

  collaborators: function() { return [] }.property(),

  isSaved: function() {
    return !this.get('hasUnsavedChanges') && !this.get('isSaving');
  }.property('hasUnsavedChanges', 'isSaving'),

  init: function(googleDocument, documentId) {
    Ember.assert('You must pass in a valid google document.', !!googleDocument);

    this.set('content', googleDocument);
    this.set('id', documentId);

    this._observeSaveState();
    this._observeUndoRedoState();
    this._observeCollaborators();

    this._refreshCollaborators();

    this._loadMeta();
  },

  ref: function() {
    var googleDocument = this.get('content');
    var model = googleDocument.getModel();
    var root = model.getRoot();

    return new Reference(model, null, null, root);
  }.property('content').readOnly(),

  meta: {},

  /* undo/redo */

  beginSave: function(name) {
    this.get('content').getModel().beginCompoundOperation();
  },

  endSave: function(name) {
    this.get('content').getModel().endCompoundOperation();
  },

  undo: function() {
    if (this.get('canUndo')) {
      this.get('content').getModel().undo();
    }
  },

  redo: function() {
    if (this.get('canRedo')) {
      this.get('content').getModel().redo();
    }
  },

  _observeSaveState: function() {
    var document = this;
    var googleDocument = this.get('content');
    googleDocument.addEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED, function(e) {
      document.set('hasUnsavedChanges', e.isPending);
      document.set('isSaving', e.isSaving);
      if (document.get('isSaved')) {
        document.trigger('saved');
      }
    });
  },

  _observeUndoRedoState: function() {
    var document = this;
    var googleDocument = this.get('content');
    googleDocument.getModel().addEventListener(gapi.drive.realtime.EventType.UNDO_REDO_STATE_CHANGED, function(e) {
      document.set('canUndo', e.canUndo);
      document.set('canRedo', e.canRedo);
    });
  },

  _observeCollaborators: function() {
    var document = this;
    var googleDocument = this.get('content');

    googleDocument.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, function(e) {
      document._refreshCollaborators();
    });

    googleDocument.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function(e) {
      document._refreshCollaborators();
    });
  },

  _refreshCollaborators: function() {
    var collaborators = this.get('collaborators');
    var googleDocument = this.get('content');

    collaborators.clear();
    collaborators.pushObjects( googleDocument.getCollaborators() );
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
          resolve(googleFileMeta);
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