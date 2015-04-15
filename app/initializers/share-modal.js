export default {
  name: 'inject-store-into-share-modal',
    after: 'store',
    initialize: function(container, application) {
      application.inject('component:share-modal', 'store', 'store:main');
    }
};
