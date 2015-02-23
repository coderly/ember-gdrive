module.exports = {
  name: 'ember-gdrive',
  
  contentFor: function(type) {
    if (type === 'head') {
      return '<script type="text/javascript" src="https://apis.google.com/js/api.js"></script>';
    }
  },
  
  config: function (environment, baseConfig) {
    
    var config = {};
    
    config.contentSecurityPolicyHeader = 'Content-Security-Policy';
    config.contentSecurityPolicy = baseConfig.contentSecurityPolicy || {};
    var requiredCSP = {
      'default-src': 'accounts.google.com content.googleapis.com drive.google.com',
      'script-src': '\'unsafe-eval\' \'unsafe-inline\' apis.google.com drive.google.com',
      'connect-src': '\'unsafe-eval\' apis.google.com drive.google.com',
      'img-src': 'data: ssl.gstatic.com csi.gstatic.com',
      'style-src': '\'unsafe-inline\''
    };
    
    if (config.contentSecurityPolicy['default-src'] === '\'none\'') {
      config.contentSecurityPolicy['default-src'] = '';
    }
    
    var mergeValues = function (item) {
      if (!config.contentSecurityPolicy[propertyName]) {
        config.contentSecurityPolicy[propertyName] = item;
      } else if (config.contentSecurityPolicy[propertyName].indexOf(item) === -1) {
        config.contentSecurityPolicy[propertyName] += ' ' + item;
      }
    };
    
    for (var propertyName in requiredCSP) {
      requiredCSP[propertyName].split(' ').forEach(mergeValues);
    }
    
    return config;
  },  
  included: function (app) {
    app.import('vendor/share-modal.css');
    app.import('vendor/loader.css');
  }
};
