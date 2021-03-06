'use strict';

module.exports = {
  normalizeEntityName: function () {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  afterInstall: function (options) {
    var addonContext = this;

    return addonContext.addBowerPackageToProject('ember-simple-auth', '~0.7.2')
    .then(function () {
      return addonContext.addAddonToProject('ember-cli-simple-auth', '~0.7.2');
    }).then(function () {
      return addonContext.insertIntoFile('config/environment.js',
        '\n      \'ember-gdrive\': {' +
        '\n        GOOGLE_API_KEY: \'<insert here>\',' +
        '\n        GOOGLE_MIME_TYPE: \'application/<insert here>\',' +
        '\n        GOOGLE_CLIENT_ID: \'<insert here>\'' +
        '\n      },\n', {
          after: 'APP: {'
        });
    });
  }
};