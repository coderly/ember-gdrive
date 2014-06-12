import GoogleDriveAuth from 'ember-gdrive/auth';
import DocumentSource from 'ember-gdrive/document-source';
import loader from 'ember-gdrive/loader';

import GoogleDriveAdapter from 'ember-gdrive/adapter';
import GoogleDriveSerializer from 'ember-gdrive/serializer';
import GoogleDriveDocument from 'ember-gdrive/document';

import State from 'ember-gdrive/state';

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

  Application.initializer({
    name: "googleDriveAuth",
    before: "store",

    initialize: function(container, application) {
      application.register('auth:google', GoogleDriveAuth);

      application.inject('controller', 'auth', 'auth:google');
      application.inject('route', 'auth', 'auth:google');


      // open file if present
      var auth = container.lookup('auth:google');
      var state = State.create();

      if (state.get('isOpen')) {
        application.open(state.get('fileID'));
      }
      else if (state.get('isCreate')) {
        loader.load().then(function() {
          return auth.checkStatus();
        }).then(function(user) {
          var fileOptions = application.create();
          return GoogleDriveDocument.create(fileOptions);
        }).then(function(doc) {
          application.open(doc.get('id'))
        });
      }
    }
  });

});