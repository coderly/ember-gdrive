/*global gapi*/
import Ember from 'ember';
import DS from 'ember-data';

var Adapter = DS.Adapter.extend({

  documentSource: null,
  documentId: Ember.computed.alias('documentSource.document.id'),

  createRecord: function (store, type, record) {

    var options = {
      resource: {
        value: record.get('emailAddress'),
        type: record.get('type'),
        role: record.get('role')
      },
      fileId: this.get('documentId'),
      sendNotificationEmails: false
    };

    var request = gapi.client.drive.permissions.insert(options);

    return new Ember.RSVP.Promise(function (resolve, reject) {
      request.execute(function (response) {
        if (response.error) {
          Ember.run(null, reject, response.error);
        } else {
          Ember.run(null, resolve, response);
        }
      });
    });
  },

  deleteRecord: function (store, type, record) {
    var request = gapi.client.drive.permissions.delete({
      fileId: this.get('documentId'),
      permissionId: record.get('id')
    });

    return new Ember.RSVP.Promise(function (resolve, reject) {
      request.execute(function (response) {
        if (response.error) {
          Ember.run(null, reject, response.error);
        } else {
          Ember.run(null, resolve, null);
        }
      });
    });
  },

  findAll: function (store, type) {
    var request = gapi.client.drive.permissions.list({
      fileId: this.get('documentId')
    });

    return new Ember.RSVP.Promise(function (resolve, reject) {
      request.execute(function (response) {
        if (response.error) {
          Ember.run(null, reject, response.error);
        } else {
          Ember.run(null, resolve, response.items);
        }
      });
    });
  }
});

export default Adapter;