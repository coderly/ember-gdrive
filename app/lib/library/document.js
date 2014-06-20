import Reference from './reference';

var Document = Ember.Object.extend(Ember.Evented, {
  id: Ember.computed.alias('file.id'),
  title: Ember.computed.alias('file.title'),
  isEditable: Ember.computed.alias('file.editable'),

  file: null,
  doc: null,

  isLoaded: false,
  loadPromise: null,

  init: function(file) {
    Ember.assert('You must pass in a valid google file.', !!file);

    this.set('file', file);
    this.get('collaborators', Ember.A());

    this.load();
  },

  load: function() {
    if (this.get('loadPromise'))
      return this.get('loadPromise');

    var document = this;

    var onLoad = function() {
      document.onLoad.apply(document, arguments);
      document.set('isLoaded', true);
    };

    var onError = function() {
      document.onError.apply(document, arguments);
    };

    var loadPromise = new Ember.RSVP.Promise(function(resolve, reject){
      gapi.drive.realtime.load(document.get('id'),
        function(d){ Ember.run(null, resolve, d); },
        Ember.K,
        function(e){ Ember.run(null, reject, e); }
      );
    }).then(onLoad, onError).then(function(){ return document; });

    this.set('loadPromise', loadPromise);

    return loadPromise;
  },

  ref: function() {
    return this.load().then(function(document) {
      window.doc = document;
      return new Reference(
        document.get('model'),
        null,
        null,
        document.get('root')
      );
    });
  },

  beginSave: function() {
    this.get('model').beginCompoundOperation();
  },

  endSave: function() {
    this.get('model').endCompoundOperation();
  },

  root: function() {
    return this.get('model').getRoot();
  }.property('model'),

  model: function() {
    return this.get('doc').getModel();
  }.property('doc'),

  onLoad: function(doc) {
    this.set('doc', doc);
    this.trigger('loaded');

    this.refreshCollaborators();
    this.setupCollaboratorEventListeners();
  },

  onError: function(e) {
    if(e.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
      this.authorizeWithGoogle();
    } else if(e.type == gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
      alert("An Error happened: " + e.message);
    } else if(e.type == gapi.drive.realtime.ErrorType.NOT_FOUND) {
      alert("The file was not found. It does not exist or you do not have read access to the file.");
    }
  },

  /* undo/redo */

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

  /* collaborator code */
  collaborators: [],

  refreshCollaborators: function() {
    var collaboratorRecords = this.get('doc').getCollaborators();
    this.set('collaborators', collaboratorRecords);
  },

  setupCollaboratorEventListeners: function() {
    var doc = this.get('doc');
    var _this = this;

    doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function() {
      _this.refreshCollaborators();
    });

    doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, function() {
      _this.refreshCollaborators();
    });
  }
});

 var filePromises = {};

Document.reopenClass({
  find: function(fileID) {
    if (filePromises[fileID])
      return filePromises[fileID];

    filePromises[fileID] = new Ember.RSVP.Promise(function(resolve, reject) {
      gapi.client.drive.files.get({fileId: fileID}).execute(function(googleFile) {
        if (googleFile.error) {
          reject(new Error(googleFile.error.message));
        }
        else {
          resolve( new Document(googleFile) );
        }
      });
    });

    return filePromises[fileID];
  },
  create: function(params) {
    var _this = this;
    return _this._sendCreateRequest(params).then(function(googleFile) {
      if (googleFile.error) {
        return Ember.RSVP.reject(new Error(googleFile.error.message));
      }
      else {
        return new Document(googleFile);
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
