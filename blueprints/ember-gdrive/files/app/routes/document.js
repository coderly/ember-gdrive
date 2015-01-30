import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-gdrive/mixins/authenticated-route-mixin';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  isSharing: false,
  actions: {
    share: function () {
      this.set('isSharing', true);
    }
  }
});
