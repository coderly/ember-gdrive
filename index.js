module.exports = {
  name: 'ember-gdrive',
  
  contentFor: function(type) {
    if (type === 'head') {
      return '<script type="text/javascript" src="https://apis.google.com/js/api.js"></script>';
    }
  },  
  included: function (app) {
    app.import('vendor/share-modal.css');
  }
};
