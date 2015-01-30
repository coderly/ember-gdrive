import Ember from 'ember';

var Config = Ember.Object.extend({
  GOOGLE_API_KEY: null,
  GOOGLE_MIME_TYPE: null,
  GOOGLE_CLIENT_ID: null,

  load: function (configuration) {
    if (configuration) {
      if (configuration.GOOGLE_API_KEY && configuration.GOOGLE_API_KEY !== '<insert here>') {
        this.set('GOOGLE_API_KEY', configuration.GOOGLE_API_KEY);
      } else {
        throw new Error('The GOOGLE_API_KEY configuration property has not been set.');
      }
      
      if (configuration.GOOGLE_MIME_TYPE && configuration.GOOGLE_MIME_TYPE !== 'application/<insert here>') {
        this.set('GOOGLE_MIME_TYPE', configuration.GOOGLE_MIME_TYPE);
      } else {
        throw new Error('The GOOGLE_MIME_TYPE configuration property has not been set.');
      }
          
      if (configuration.GOOGLE_CLIENT_ID && configuration.GOOGLE_CLIENT_ID !== '<insert here>') {
        this.set('GOOGLE_CLIENT_ID', configuration.GOOGLE_CLIENT_ID);
      } else {
        throw new Error('The GOOGLE_CLIENT_ID configuration property has not been set.');
      }
    } else {
      throw new Error('The \'ember-gdrive\' configuration group is not present. Please add a configuration group containing the Google API information to your application configuration\'s \'ENV.APP\' object.');
    }
  }
});

export default Config.create();