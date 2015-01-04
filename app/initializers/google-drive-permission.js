export default {
  name: 'google-drive-permission',
  after: 'google-drive',
  initialize: function (container, application) {
    application.inject('adapter:google-drive-permission', 'documentSource', 'document-source:main');
  }
};