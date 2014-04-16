"use strict";
var queryParams = function() {
  var params = {};
  location.search.substr(1).split("&").forEach(function(item) {
    params[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
  });
  return params;
};

exports["default"] = Ember.Object.extend({

  application: Ember.required(),

  redirectToFileIfProvided: function() {
    if (this.fileProvided()) {
      this.redirectToFile(this.get('fileID'));
    }
  },

  redirectToFile: function(fileID) {
    window.location = this.redirectToFilePath(fileID);
  },

  redirectToFilePath: function(fileID) {
    return window.location.pathname + '#/project/' + fileID;
  },

  fileID: function() {
    return this.get('fileIDs').objectAt(0);
  }.property('fileIDs'),

  fileProvided: function() {
    return this.get('action') == 'open' && this.get('fileIDs');
  },

  queryParams: function() {
    return queryParams();
  }.property(),

  state: function() {
    try {
      return JSON.parse(this.get('queryParams.state'));
    } catch (e) {
      return null;
    }
  }.property('queryParams'),

  action: Ember.computed.alias('state.action'),
  userID: Ember.computed.alias('state.userId'),
  fileIDs: Ember.computed.alias('state.ids'),
  folderID: Ember.computed.alias('state.folderId')
});