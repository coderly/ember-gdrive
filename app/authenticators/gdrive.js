import Ember from 'ember';
import Base from 'simple-auth/authenticators/base';
import Auth from 'ember-gdrive/lib/auth';
import { fetchLoginHint } from 'ember-drive/lib/login-hint';
import config from 'ember-gdrive/lib/config';

var Authenticator = Base.extend({

  auth: function () {
    return Auth.create();
  }.property(),

  restore: function (properties) {
    var authenticator = this;
    return authenticator.get('auth').authorizeImmediate({
      login_hint: fetchLoginHint(),
      client_id: config.get('GOOGLE_CLIENT_ID')
    }).then(function () {
      return authenticator.get('auth').fetchCurrentUser();
    });
  },

  authenticate: function (options) {
    var authenticator = this;
    options = options || {};
    return authenticator.get('auth').authorize(Ember.merge(options, { client_id: config.get('GOOGLE_CLIENT_ID') })).then(function () {
      return authenticator.get('auth').fetchCurrentUser();
    });
  },

  invalidate: function () {
    return this.get('auth').close();
  }
});

export default Authenticator;
