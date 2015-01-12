import Ember from 'ember';
import LoginControllerMixin from 'simple-auth/mixins/login-controller-mixin';

export default Ember.Mixin.create(LoginControllerMixin, {
  authenticator: 'authenticator:gdrive'
});
