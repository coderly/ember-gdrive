"use strict";
var INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install',
    FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file',
    OPENID_SCOPE = 'openid';

var Auth = Ember.StateManager.extend({
  enableLogging: false,
  initialState: 'loggedOut',

  user: null,

  // isLoggedIn is deprecated but used elsewhere
  isLoggedIn: Ember.computed.alias('isAuthenticated'),

  clientID: ENV.GOOGLE_CLIENT_ID,
  userID: Ember.computed.alias('user.id'),
  permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

  token: function() {
    return gapi.auth.getToken().access_token;
  }.property('currentState'),

  checkStatus: function() {
    if (this.get('isAuthenticated')) {
      return Ember.RSVP.resolve(this.get('user'));
    }

    var auth = this;
    auth.transitionTo('checking');
    return auth._fetchLoginState().then(function() {
      auth.transitionTo('loggingIn.fetchingUser');
      return auth._fetchUserObject();
    }, function(error){
      auth.transitionTo('loggedOut.known');
      return Ember.RSVP.reject(error);
    }, "checkStatus _fetchLoginState handler").then(function(user) {
      auth.transitionTo('loggedIn');
      auth.set('user', user);
      return user;
    }, null, "checkState _fetchUserObject handler");
  },

  login: function() {
    this.transitionTo('loggingIn.showingPrompt');
  },

  _fetchLoginState: function() {
    var auth = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      gapi.auth.authorize({
        client_id: auth.get('clientID'),
        user_id: auth.get('userID'),
        scope: auth.get('permissions'),
        immediate: true
      }, function(result){
        if (result && !result.error) {
          Ember.run(null, resolve);
        } else {
          Ember.run(null, reject, result && result.error ? result.error : 'unauthenticated');
        }
      })
    }, 'GoogleDriveAuth _fetchLoginState');
  },

  _fetchUserObject: function(handler) {
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

  states: {
    loggedOut: Ember.State.create({
      initialState: 'unknown',
      unknown: Ember.State.create(),

      enter: function() {
        this.set('isUnauthenticated', true);
      },
      exit: function() {
        this.set('isUnauthenticated', false);
      },

      checking: Ember.State.create(),
      known: Ember.State.create(),
      loginFailed: Ember.State.create()
    }),

    loggedIn: Ember.State.create({
      enter: function(stateManager) {
        stateManager.trigger('loggedin');
        stateManager.set('isAuthenticated', true);
      },
      exit: function(stateManager) {
        stateManager.trigger('loggedout');
        stateManager.set('isAuthenticated', false);
      }
    }),

    loggingIn: Ember.State.create({

      fetchingUser: Ember.State.create(),

      showingPrompt: Ember.State.create({
        enter: function(stateManager) {
          var handler = function(result) {
            if (result && !result.error) {
              stateManager.transitionTo('fetchingUser');
            }
            else {
              stateManager.transitionTo('loggedOut.loginFailed');
            }
          };
          gapi.auth.authorize({
            client_id: stateManager.get('clientID'),
            user_id: stateManager.get('userID'),
            scope: stateManager.get('permissions'),
            immediate: false
          }, handler);
        }
      })
    })
  }
});

exports["default"] = Auth;