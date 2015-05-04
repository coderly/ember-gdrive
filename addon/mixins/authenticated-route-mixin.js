import Ember from 'ember';
import { cacheLoginHint } from 'ember-gdrive/lib/login-hint';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Mixin.create(AuthenticatedRouteMixin, {
  model: function (params) {
    return this.get('documentSource').load(params.document_id);
  },

  afterModel: function (document, transition) {
    var userId = this.get('session.secure.id');
    var documentId = this.get('documentSource.id');
    cacheLoginHint(documentId, userId);
  }
});
