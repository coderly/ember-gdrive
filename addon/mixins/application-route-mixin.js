import Ember from 'ember';
import ApplicationRouteMixin from 'simple-auth/mixins/application-route-mixin';

export default Ember.Mixin.create(ApplicationRouteMixin, {
  beforeModel: function (transition) {

    this._super(transition);

    var route = this;
    var documentSource = route.get('documentSource');
    var state = documentSource.get('state'); // Forces creation of the state, which clears the query params
    var isStatePresent = state.get('isOpen') || state.get('isCreate');

    if (isStatePresent) {
      this.get('session').authenticate('authenticator:gdrive', { 'login_hint': state.get('userID') }).then(function () {
        if (state.get('isOpen')) {
          return documentSource.openFromState();
        } else {
          return documentSource.createFromState();
        }
      }).then(function (doc) {
          route.transitionToDocument(doc);
      });
    }
  },

  actions: {
    login: function () {
      this.session.authenticate('authenticator:gdrive');
    },
    logout: function () {
      var route = this,
        session = this.get('session');

      session.invalidate().then(function () {
        route.transitionTo('login');
      });
    },
    documentCreated: function (doc) {
      this.transitionToDocument(doc);
    }
  },

  transitionToDocument: function (doc) {
    this.transitionTo('document', doc);
  }
});
