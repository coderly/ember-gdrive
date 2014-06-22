"use strict";
var scopes = ['https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.file',
  'openid'].join(' ');

var LocalCache = require("./local-cache")["default"];

var documentUserCache = new LocalCache('document:user');

Ember.Route.reopen({
  requiresAuth: false,

  beforeModel: function(transition) {
    if (this.get('requiresAuth')) {
      Ember.assert('requiresAuth can only be true when a document route is present', transition.params.document);

      var route = this,
        documentId = transition.params.document.document_id,
        documentUserId = documentUserCache.get(documentId);

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
  }

});