import Document from './document';

var DocumentSource = Ember.Object.extend({
  id: null,
  document: null,
  isLoaded: Ember.computed.bool('id'),

  load: function(documentId) {
    Ember.assert('Document with id ' + this.get('id') + ' was already loaded', !this.get('isLoaded'));
    var documentSource = this;

    this.set('id', documentId);

    return Document.find( documentId ).then(function(doc) {
      return documentSource.set('document', doc);
    });
  }

});

export default DocumentSource;