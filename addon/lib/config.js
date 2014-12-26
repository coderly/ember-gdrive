import Ember from 'ember';

var Config = Ember.Object.extend({
  GOOGLE_API_KEY: null,
  GOOGLE_MIME_TYPE: null,
  GOOGLE_DRIVE_SDK_APP_ID: null,
  GOOGLE_CLIENT_ID: null,
  
  load: function (configuration) {
    this.set('GOOGLE_API_KEY', configuration.GOOGLE_API_KEY);
    this.set('GOOGLE_MIME_TYPE', configuration.GOOGLE_MIME_TYPE);
    this.set('GOOGLE_DRIVE_SDK_APP_ID', configuration.GOOGLE_DRIVE_SDK_APP_ID);
    this.set('GOOGLE_CLIENT_ID', configuration.GOOGLE_CLIENT_ID);
  }
});

export default Config.create();