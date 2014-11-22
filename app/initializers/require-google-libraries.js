import loader from 'ember-gdrive/lib/loader';

export default {
  name: 'require-google-libraries',
  before: 'google-drive-auth',
    initialize: function(container, application) {
      application.deferReadiness();
      loader.load().then(function() {
        application.advanceReadiness();
      });
    }
};