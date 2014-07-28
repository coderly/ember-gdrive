"use strict";
var INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install',
    FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file',
    OPENID_SCOPE = 'openid';

var merge = function(a, b) {
  return Ember.merge(a || {}, b || {});
};

var Auth = Ember.Object.extend();

Auth.reopenClass({
  isAuthenticated: false,
  isUnauthenticated: Ember.computed.not('isAuthenticated'),

  user: null,
  userID: Ember.computed.alias('user.id'),

  clientID: ENV.GOOGLE_CLIENT_ID,
  permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

  authorize: function(options) {
    var finalOptions = merge({
      client_id: this.clientID,
      scope: this.permissions,
      authuser: -1,
      immediate: false,
      cookie_policy: 'single_host_origin'
    }, options || {});

    return new Ember.RSVP.Promise(function(resolve, reject) {
      console.log('authorize', finalOptions);
      gapi.auth.authorize(finalOptions, function(result) {
        if (result && !result.error) {
          Ember.run(null, resolve, result);
        } else {
          Ember.run(null, reject, result && result.error ? result.error : 'unauthenticated');
        }
      });
    }, 'ember-gdrive: Auth#authorize');
  },

  authorizeImmediate: function(options) {
    return this.authorize(merge({
      immediate: true
    }, options));
  },

  fetchCurrentUser: function() {
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
  },

  close: function(){
    return new Ember.RSVP.Promise(function(resolve){
      gapi.auth.signOut();
      resolve();
    });
  }

});

exports["default"] = Auth;