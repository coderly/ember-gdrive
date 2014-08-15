"use strict";
var GoogleDriveAuth = require("ember-gdrive/auth")["default"];
var DocumentSource = require("ember-gdrive/document-source")["default"];
var loader = require("ember-gdrive/loader")["default"];

var GoogleDriveAdapter = require("ember-gdrive/adapter")["default"];
var GoogleDriveSerializer = require("ember-gdrive/serializer")["default"];

/**
 Register the serializer and adapter
 */
Ember.onLoad('Ember.Application', function(Application) {

  Application.initializer({
    name: 'google-drive',
    after: 'store',
    initialize: function(container, application) {
      application.register('adapter:-google-drive', GoogleDriveAdapter);
      application.register('serializer:-google-drive', GoogleDriveSerializer);

      application.register('document-source:main', DocumentSource);

      application.inject('route', 'documentSource', 'document-source:main');
      application.inject('controller', 'documentSource', 'document-source:main');
      application.inject('adapter:application', 'documentSource', 'document-source:main');
    }
  });

  Application.initializer({
    name: 'requireGoogleLibraries',
    before: 'googleDriveAuth',
    initialize: function(container, application) {
      application.deferReadiness();
      loader.load().then(function() {
        application.advanceReadiness();
      });
    }
  });

  //@TODO: remove
  Application.initializer({
    name: "googleDriveAuth",
    before: "store",

    initialize: function(container, application) {
      application.register('auth:google', GoogleDriveAuth, {instantiate: false});

      application.inject('controller', 'auth', 'auth:google');
      application.inject('route', 'auth', 'auth:google');
    }
  });

});