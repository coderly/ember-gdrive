import Document from './document';
import State from './state';
import loader from './loader';
import LocalCache from './local-cache';

var DocumentSource = Ember.Object.extend({
  id: null,
  document: null,
  isLoaded: Ember.computed.bool('id'),

  authAndLoad: function(documentId) {
    var documentSource = this;
    return this.get('auth').login(this._authOptionsFor(documentId)).then(function(user) {
      return documentSource._load(documentId);
    });
  },

  openOrCreate: function(route) {
    var state = State.create(),
      auth = this.get('auth');

    if (state.get('isOpen')) {
      route.transitionTo('document', state.get('fileID'));
    }
    else if (state.get('isCreate')) {
      return loader.load().then(function() {
        return auth.login({immediate: true, user_id: state.get('userID')});
      }).then(function() {
        var title = prompt('Enter a document name') || 'Untitled document';
        return Document.create({title: title});
      }).then(function() {
        return route.transitionTo('document', state.get('fileID'));
      });
    }
  },

  _authOptionsFor: function(documentId) {
    var documentUserId = this.get('_documentUserCache').get(documentId);
    if (documentUserId) {
      return {immediate: true, user_id: documentUserId};
    }
    else {
      return {immediate: false};
    }
  },

  _load: function(documentId) {
    Ember.assert('Document with id ' + this.get('id') + ' was already loaded', !this.get('isLoaded'));

    var documentSource = this,
        documentUserCache = this.get('_documentUserCache'),
        auth = this.get('auth');

    return Document.find( documentId ).then(function(doc) {
      documentSource.set('id', documentId);
      documentSource.set('document', doc);
      documentUserCache.set(documentId, auth.get('user.id'));

      return doc;
    });
  },

  _documentUserCache: function() {
    return new LocalCache('document:user');
  }.property()

});

export default DocumentSource;