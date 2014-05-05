"use strict";
var queryParams = function() {
  var params = {};
  location.search.substr(1).split("&").forEach(function(item) {
    params[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
  });
  return params;
};

exports["default"] = Ember.Object.extend({

  fileID: function() {
    return this.get('fileIDs').objectAt(0);
  }.property('fileIDs'),

  isOpen: function() {
    return this.get('action') == 'open';
  }.property('action'),

  isCreate: function() {
    return this.get('action') == 'create';
  }.property('action'),

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