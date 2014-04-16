Ember.Route.reopen({
  requiresAuth: false,
  beforeModel: function() {
    if (this.get('requiresAuth')) {
      var auth = this.get('auth');
      return auth.checkStatus();
    }
  }
});