import Base from 'simple-auth/authenticators/base';
import Auth from 'ember-gdrive/lib/auth';

var Authenticator = Base.extend({

  auth: function () {
    return Auth.create();
  }.property(),

  restore: function (properties) {
    var authenticator = this;
    return authenticator.get('auth').authorizeImmediate().then(function () {
      return authenticator.get('auth').fetchCurrentUser();
    });
  },

  authenticate: function (options) {
    var authenticator = this;
    options = options || {};
    return authenticator.get('auth').authorize(options).then(function () {
      return authenticator.get('auth').fetchCurrentUser();
    });
  },

  invalidate: function () {
    return this.get('auth').close();
  }
});

export default Authenticator;
