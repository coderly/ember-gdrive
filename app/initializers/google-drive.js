import DocumentSource from 'ember-gdrive/lib/document-source';
import GoogleDriveAdapter from 'ember-gdrive/adapters/google-drive';
import GoogleDriveSerializer from 'ember-gdrive/lib/serializer';

export default {
  name: 'google-drive',
  after: 'store',
  initialize: function (container, application) {
    application.register('adapter:-google-drive', GoogleDriveAdapter);
    application.register('serializer:-google-drive', GoogleDriveSerializer);

    application.register('document-source:main', DocumentSource);

    application.inject('route', 'documentSource', 'document-source:main');
    application.inject('controller', 'documentSource', 'document-source:main');
    application.inject('adapter:application', 'documentSource', 'document-source:main');
    application.inject('adapter:google-drive-permission', 'documentSource', 'document-source:main');
    application.inject('component:document-creator', 'documentSource', 'document-source:main');
  }
};
