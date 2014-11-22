import GoogleDriveAuth from 'ember-gdrive/lib/auth';

export default {
  name: 'google-drive-auth',
  before: ['store', 'simple-auth'],
  initialize: function (container, application) {
    application.register('auth:google', GoogleDriveAuth, {
      instantiate: false
    });

    application.inject('controller', 'auth', 'auth:google');
    application.inject('route', 'auth', 'auth:google');
  }
};