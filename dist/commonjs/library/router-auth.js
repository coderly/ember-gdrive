"use strict";
Ember.Route.reopen({
  requiresAuth: false,
  beforeModel: function() {
    var route = this;
    if (this.get('requiresAuth')) {
      return this.get('auth').checkStatus().then(function(user) {
        return user;
      }, function(error) {
        route.unauthenticated('unauthenticated');
      });
    }
  },

  unauthenticated: function() {
    Ember.assert('You must override unauthenticated for the routes where requiresAuth is set to true');
  }

});