var scopes = ['https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.file',
  'openid'].join(' ');

Ember.Route.reopen({
  requiresAuth: false,

  beforeModel: function(transition) {
    var route = this;

    if (this.get('requiresAuth')) {
      window.somecallback = function(result) {
        debugger;
      };

      gapi.auth.signIn({
        cookiepolicy: 'single_host_origin',
        clientid: ENV.GOOGLE_CLIENT_ID,
        callback: somecallback,
        scope: scopes
      });
//      return route.get('auth').login({authuser: -1}).then(function() {
//        return route.get('documentSource').load(transition.params.document.document_id);
//      });
//      return this.get('auth').checkStatus().then(function(user) {
//        return user;
//      }, function(error) {
//        return route.get('auth').login({authuser: -1});
//      }).then(function() {
//        return route.get('documentSource').load(transition.params.document.document_id);
//      }).then(function(doc) {
//        return doc;
//      }, function(reason) {
//        debugger;
//        route.unauthenticated(transition);
//      });
    }
  },

  unauthenticated: function() {
    Ember.assert('You must override unauthenticated for the routes where requiresAuth is set to true');
  }

});