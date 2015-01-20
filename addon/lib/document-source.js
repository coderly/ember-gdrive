import Ember from 'ember';
import Document from 'ember-gdrive/lib/document';
import State from 'ember-gdrive/lib/state';
import loader from 'ember-gdrive/lib/loader';

var DocumentSource = Ember.Object.extend({
  document: null,
  id: Ember.computed.alias('document.id'),
  isLoaded: Ember.computed.bool('id'),

  state: function() {
    return State.create();
  }.property(),

  openFromState: function() {
    var state = this.get('state');
    if (state.get('isOpen')) {
      return this.load(state.get('fileID'));
    }
    else {
      return Ember.RSVP.Promise.reject('failed to open');
    }
  },

  createFromState: function() {
    var state = this.get('state');
    var documentSource = this;

    if (state.get('isCreate')) {
      var title = window.prompt('Enter a document name') || 'Untitled document';

      return Document.create({title: title}).then(function(doc) {
        documentSource.set('document', doc);
        return doc;
      });
    } else {
      return Ember.RSVP.Promise.reject('failed to create');
    }
  },
  
  createDocument: function (title) {
    var documentSource = this;
    if (!Ember.isEmpty(title)) {
      return Document.create({title: title}).then(function(doc) {
        documentSource.set('document', doc);
        return doc;
      });
    }  
  },

  load: function(documentId) {
    Ember.assert('Document with id ' + this.get('id') + ' was already loaded', !this.get('isLoaded'));

    var documentSource = this;
    return Document.find( documentId ).then(function(doc) {
      documentSource.set('document', doc);
      return doc;
    });
  }

});

export default DocumentSource;