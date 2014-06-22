"use strict";
var Reference = require("./reference")["default"];

var Document = Ember.Object.extend(Ember.Evented, {
  content: null,

  init: function(googleDocument) {
    Ember.assert('You must pass in a valid google document.', !!googleDocument);
    this.set('content', googleDocument);
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

  /* undo/redo */

  beginSave: function() {
    this.get('model').beginCompoundOperation();
  },

  endSave: function() {
    this.get('model').endCompoundOperation();
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
        return new Document(googleDocument);
    }, function(e) {
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

exports["default"] = Document;