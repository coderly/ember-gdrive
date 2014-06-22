import { extractQueryParams, clearQueryString } from './uri';

export default Ember.Object.extend({

  init: function() {
    this.set('queryParams', extractQueryParams());
    clearQueryString();
  },

  fileID: function() {
    return this.get('fileIDs').objectAt(0);
  }.property('fileIDs'),

  isOpen: function() {
    return this.get('action') == 'open';
  }.property('action'),

  isCreate: function() {
    return this.get('action') == 'create';
  }.property('action'),

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
  folderID: Ember.computed.alias('state.folderId'),

  queryParams: {}

});