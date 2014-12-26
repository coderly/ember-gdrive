import config from 'ember-gdrive/lib/config';

export default {
  name: 'load-config',
  before: 'simple-auth',

  initialize: function(container, app) {

    //get you setting off of the app instance
    config.load(app.get('ember-gdrive'));    
  }
};