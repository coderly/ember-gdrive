"use strict";
var Document = require("./document")["default"];

var DocumentSource = Ember.Object.extend({
  id: null,
  document: null,
  isLoaded: Ember.computed.bool('id'),

  load: function(documentId) {
    Ember.assert('Document with id ' + this.get('id') + ' was already loaded', !this.get('isLoaded'));

    var documentSource = this;
    return Document.find( documentId ).then(function(doc) {
      documentSource.set('id', documentId);
      documentSource.set('document', doc);

      return doc;
    });
  }

});

exports["default"] = DocumentSource;