module.exports = {
  normalizeEntityName: function () {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  afterInstall: function (options) {
    var addonContext = this;

    return this.addBowerPackageToProject('ember-simple-auth', '~0.7.2')
      .then(function () {
        return addonContext.addAddonToProject('ember-cli-simple-auth', '~0.7.2');
      });
  }
};