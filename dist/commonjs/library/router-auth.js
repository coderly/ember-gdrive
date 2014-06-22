"use strict";
var scopes = ['https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.file',
  'openid'].join(' ');

var LocalCache = require("./local-cache")["default"];

var documentUserCache = new LocalCache('document:user');

Ember.Route.reopen({
  requiresAuth: false,

  beforeModel: function(transition) {
    var route = this,
        documentId = transition.params.document.document_id,
        documentUserId = documentUserCache.get(documentId);

    if (this.get('requiresAuth')) {
      return this.get('auth').login({immediate: true, user_id: documentUserId}).then(function(user) {
        return user;
      }).then(function(user) {
        return route.get('documentSource').load(documentId);
      }).then(function(document) {
        documentUserCache.set(route.get('documentSource.id'), route.get('auth.user.id'));
        return document;
      }, function(reason) {
        return route.get('auth').login().then(function(user) {
          return route.get('documentSource').load(documentId).then(function(document) {
            documentUserCache.set(route.get('documentSource.id'), route.get('auth.user.id'));
            return document;
          });
        });
      });
    }
  },

  unauthenticated: function() {
    Ember.assert('You must override unauthenticated for the routes where requiresAuth is set to true');
  }

});