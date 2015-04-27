import Ember from 'ember';
import { cacheLoginHint } from 'ember-gdrive/lib/login-hint';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Mixin.create(AuthenticatedRouteMixin, {
  model: function (params) {
    var route = this;

    return this.get('documentSource').load(params.document_id).then(function (doc) {
      var userId = route.get('session.id');
      var documentId = route.get('documentSource.document.id');
      cacheLoginHint(documentId, userId);
      return doc;
    });
  }
});
