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
      application.inject('adapter:application', 'documentSource', 'document-source:main');
    }
  });

  Application.initializer({
    name: 'requireGoogleLibraries',
    before: 'googleDrive',
    initialize: function(container, application) {
      application.deferReadiness();
      loader.load().then(function() {
        application.advanceReadiness();
      });
    }
  });

  Application.initializer({
    name: "googleDrive",
    before: "store",

    initialize: function(container, application) {
      application.register('auth:google', GoogleDriveAuth);

      application.inject('controller', 'auth', 'auth:google');
      application.inject('route', 'auth', 'auth:google');

      var auth = container.lookup('auth:google');
    }
  });

});