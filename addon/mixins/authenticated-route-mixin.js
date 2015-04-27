import Ember from 'ember';
import { cacheLoginHint } from 'ember-gdrive/lib/login-hint';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Mixin.create(AuthenticatedRouteMixin, {
  model: function (params) {
    return this.get('documentSource').load(params.document_id).then(function (doc) {
      var userId = this.get('session.id');
      var documentId = this.get('documentSource.document.id');
      cacheLoginHint(documentId, userId);
      return doc;
    });
  }
});
