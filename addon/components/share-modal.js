/*global gapi, alert, confirm*/
import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'share-modal',
  classNames: ['share-modal-wrapper'],
  classNameBindings: ['isOpen:open'],
  
  shareAddress: null,
  isOpen: false,

  onOpening: function () {
    this.loadData();
  }.on('willOpen'),

  onClosing: function () {
    this.set('shareAddress', null);
  }.on('willClose'),

  closeOnClick: function (event) {
    if (event.target === this.get('element')) {
      this.close();
    }
  }.on('click'),

  open: function () {
    this.trigger('willOpen');
    this.set('isOpen', true);
  },

  close: function () {
    this.trigger('willClose');
    this.set('isOpen', false);
  },

  'open-when': false,

  openWhen: function () {
    if (!this.get('open-when')) {
      return;
    }
    this.open();
    this.set('open-when', false);
  }.observes('open-when'),

  actions: {

    share: function () {
      this.share();
    },

    removePermission: function (permission) {
      this.removePermission(permission);
    },

    close: function () {
      this.close();
    }
  },

  loadData: function () {
    var component = this,
      store = component.get('store');
    store.unloadAll('google-drive-permission');
    store.find('google-drive-permission').then(function (permissions) {
      component.set('permissions', permissions);
    });
  },

  share: function () {
    var component = this;
    var permission = component.get('store').createRecord('google-drive-permission', {
      emailAddress: this.get('shareAddress'),
      type: 'user', // user, group, domain, anyone
      role: 'writer' // owner, reader, writer
    });
    permission.save().then(function () {
      component.set('shareAddress', null);
    }, function (error) {
      permission.rollback();
      alert(error.message);
    });
  },

  removePermission: function (permission) {
    var component = this;
    if (confirm('Are you sure?')) {
      permission.deleteRecord();
      permission.save().then(null, function (error) {
        permission.rollback();
        Ember.run.once(component, component.loadData, null);
      });
    }
  },
});
