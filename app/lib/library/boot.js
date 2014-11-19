import GoogleDriveAuth from 'ember-gdrive/auth';
import DocumentSource from 'ember-gdrive/document-source';
import loader from 'ember-gdrive/loader';

import GoogleDriveAdapter from 'ember-gdrive/adapter';
import GoogleDriveSerializer from 'ember-gdrive/serializer';

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
    before: ["store", "simple-auth"],
    initialize: function(container, application) {
      application.register('auth:google', GoogleDriveAuth, {instantiate: false});

      application.inject('controller', 'auth', 'auth:google');
      application.inject('route', 'auth', 'auth:google');
    }
  });

});