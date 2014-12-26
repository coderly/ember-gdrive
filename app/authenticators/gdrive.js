import Ember from 'ember';
import Base from 'simple-auth/authenticators/base';
import Auth from 'ember-gdrive/lib/auth';
import Cache from 'ember-gdrive/lib/local-cache';
import Config from '../config/environment';

var Authenticator = Base.extend({
  
  auth: function () {
    return Auth.create();
  }.property(),
  
  restore: function (properties) {
    var authenticator = this;
    return authenticator.get('auth').authorizeImmediate({
      login_hint: this.inferUserId(),
      client_id: Config['ember-gdrive'].GOOGLE_CLIENT_ID
    }).then(function () {
      return authenticator.get('auth').fetchCurrentUser();
    });
  },

  authenticate: function (options) {
    var authenticator = this;
    return authenticator.get('auth').authorize(Ember.merge(options, { client_id: Config['ember-gdrive'].GOOGLE_CLIENT_ID })).then(function () {
      return authenticator.get('auth').fetchCurrentUser();
    });
  },

  invalidate: function () {
    return this.get('auth').close();
  },
  
  extractQueryParams: function () {
    var params = {};
    location.search.substr(1).split('&').forEach(function (item) {
      params[item.split('=')[0]] = decodeURIComponent(item.split('=')[1]);
    });
    return params.state ? JSON.parse(params.state) : {};
  },
  
  getDocumentIdFromLocation: function () {
    return location.href.split('/#/d/')[1].split('/')[0];
  },
  
  inferUserId: function() {
    var userId = this.extractQueryParams().userId;
    if (!userId) {
      var cache = new Cache('document_login_hint');
      userId = cache.get(this.getDocumentIdFromLocation());
    }
    return userId;
  }
});

export default Authenticator;