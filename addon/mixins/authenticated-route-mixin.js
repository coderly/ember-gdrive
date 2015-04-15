import Ember from 'ember';
import Cache from 'ember-gdrive/lib/local-cache';
import AuthenticatedRouteMixin from 'simple-auth/mixins/authenticated-route-mixin';

export default Ember.Mixin.create(AuthenticatedRouteMixin, {
  cacheLoginHint: function() {
    var userId = this.get('session.id');
    var docId = this.get('documentSource.document.id');
    var cache = new Cache('document_login_hint');

    cache.set(docId, userId);
  },

  model: function (params) {
      var route = this;
      return this.get('documentSource').load(params.document_id).then(function (doc) {
        route.cacheLoginHint();
        return doc;
      });
  }
});
