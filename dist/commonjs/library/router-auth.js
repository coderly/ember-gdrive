"use strict";
Ember.Route.reopen({
  requiresAuth: false,

  beforeModel: function(transition) {
    var route = this;

    if (this.get('requiresAuth')) {
      return this.get('auth').checkStatus().then(function(user) {
        return user;
      }, function(error) {
        route.unauthenticated('unauthenticated');
      }).then(function() {
        return route.get('documentSource').load(transition.params.document.document_id);
      }).then(function(doc) {
        return doc;
      }, function(reason) {
        route.unauthenticated('unauthenticated');
      });
    }
  },

  unauthenticated: function() {
    Ember.assert('You must override unauthenticated for the routes where requiresAuth is set to true');
  }

});