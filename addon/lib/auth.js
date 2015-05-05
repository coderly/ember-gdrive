/*global gapi */
var INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install',
    FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file',
    OPENID_SCOPE = 'openid';

import Ember from 'ember';
import loader from 'ember-gdrive/lib/loader';
import { fetchLoginHint } from 'ember-gdrive/lib/login-hint';
import config from 'ember-gdrive/lib/config';

var merge = function(a, b) {
  return Ember.merge(a || {}, b || {});
};

var Auth = Ember.Object.extend({
  isAuthenticated: false,
  isUnauthenticated: Ember.computed.not('isAuthenticated'),

  user: null,
  userID: Ember.computed.alias('user.id'),
  permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

  authorize: function(options) {
    var finalOptions = merge({
      scope: this.permissions,
      authuser: -1,
      client_id: config.get('GOOGLE_CLIENT_ID'),
      immediate: false
    }, options || {});

    Ember.assert('GOOGLE_CLIENT_ID was not set', finalOptions.client_id);

    return new Ember.RSVP.Promise(function(resolve, reject) {
      loader.load().then(function () {
        gapi.auth.authorize(finalOptions, function (result) {
          if (result && !result.error) {
            Ember.run(null, resolve, result);
          } else {
            Ember.run(null, reject, result && result.error ? result.error : 'unauthenticated');
          }
        });
      });
    }, 'ember-gdrive: Auth#authorize');
  },

  authorizeImmediate: function(options) {
    return this.authorize(merge({
      login_hint: fetchLoginHint(),
      immediate: true
    }, options || {}));
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

export default Auth;
