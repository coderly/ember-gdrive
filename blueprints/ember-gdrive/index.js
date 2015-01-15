module.exports = {
  normalizeEntityName: function () {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  afterInstall: function (options) {
    var addonContext = this;

    return this.addBowerPackageToProject('ember-simple-auth')
      .then(function () {
        return addonContext.addPackageToProject('ember-cli-simple-auth');
      });
  },
  
  afterUninstall: function (options) {
    // Ideally, we would remove the extra packages we added during 'afterInstall'
    // from within this hook. However, no such option seems to be available at the  
    // moment
    
    // In fact, I'm not even finding an ember uninstall:<type> command at the moment
  }
};