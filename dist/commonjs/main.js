"use strict";
require("ember-gdrive/router-auth");require("ember-gdrive/boot");
Ember.Application.reopen({
  create: function() {
    Ember.assert('You must implement create() for Ember.Application');
  },
  open: function(id) {
    Ember.assert('You must implement open(id) for Ember.Application');
  }
});