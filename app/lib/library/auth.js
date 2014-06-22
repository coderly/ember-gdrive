var INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install',
    FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file',
    OPENID_SCOPE = 'openid';

var Auth = Ember.Object.extend({
  isAuthenticated: false,
  isUnauthenticated: Ember.computed.not('isAuthenticated'),

  user: null,
  userID: Ember.computed.alias('user.id'),

  clientID: ENV.GOOGLE_CLIENT_ID,
  permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

  token: function() {
    return gapi.auth.getToken().access_token;
  }.property().volatile(),

  checkStatus: function() {
    if (this.get('isAuthenticated')) {
      return Ember.RSVP.resolve(this.get('user'));
    }

    var auth = this;
    return this.authorizeWithGoogle({immediate: true}).then(function() {
      auth.set('isAuthenticated', true);

      return auth.fetchGoogleUserObject();
    }).then(function(user) {
      auth.set('user', user);
      return user;
    });
  },

  login: function(options) {
    var auth = this;
    return this.authorizeWithGoogle(options).then(function(result) {
      auth.set('isAuthenticated', true);

      return auth.fetchGoogleUserObject();
    }).then(function(user) {
      auth.set('user', user);

      debugger;
      return user;
    });
  },

  authorizeWithGoogle: function(options) {
    var finalOptions = Ember.merge(options, {
      client_id: this.get('clientID'),
      scope: this.get('permissions')
    });

    return new Ember.RSVP.Promise(function(resolve, reject) {
      console.log('authorize', finalOptions);
      gapi.auth.authorize(finalOptions, function(result) {
        if (result && !result.error) {
          Ember.run(null, resolve, result);
        } else {
          Ember.run(null, reject, result && result.error ? result.error : 'unauthenticated');
        }
      });
    }, 'ember-gdrive: Auth#authorizeWithGoogle');
  },

  fetchGoogleUserObject: function() {
    return new Ember.RSVP.Promise(function(resolve, reject) {
      gapi.client.oauth2.userinfo.get().execute(function(user) {
        if (user.id) {
          Ember.run(null, resolve, user);
        }
        else {
          Ember.run(null, reject);
        }
      });
    }, 'GoogleDriveAuth _fetchUserObject');
  }

});

export default Auth;
