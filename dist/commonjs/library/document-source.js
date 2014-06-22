"use strict";
var Document = require("./document")["default"];

var DocumentSource = Ember.Object.extend({
  id: null,
  document: null,

  load: function(documentId) {
    var documentSource = this;

    this.set('id', documentId);

    return Document.find( documentId ).then(function(doc) {
      return documentSource.set('document', doc);
    });
  }

});

exports["default"] = DocumentSource;