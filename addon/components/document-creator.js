import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'document-creator',
    classNames: 'document-creator',
    documentTitle: null,
    isCreating: false,

    actions: {
      createDocument: function () {
        this.createDocument();
      },
    },

    createDocument: function () {
      var title = this.get('documentTitle').trim(),
        component = this;

      this.set('isCreating', true);

      return this.get('documentSource').createDocument(title).then(function (doc) {
        component.sendAction('documentCreated', doc);
        component.set('isCreating', false);
      }, function (error) {
        component.set('isCreating', false);
      });
    }
});
