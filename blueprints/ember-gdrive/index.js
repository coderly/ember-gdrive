module.exports = {
  description: '',

  afterInstall: function (options) {
    var that = this;
 
    return this.addBowerPackageToProject('ember-simple-auth').then(function () {
      return this.addAddonToProject('ember-cli-simple-auth');
    });

  }
};
