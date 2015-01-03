import Ember from 'ember';
import DS from 'ember-data';

var GoogleDrivePermission = DS.Model.extend({
  domain: DS.attr('string'),
  emailAddress: DS.attr('string'),
  etag: DS.attr('string'),
  kind: DS.attr('string'),
  name: DS.attr('string'),
  photoLink: DS.attr('string'),
  role: DS.attr('string'),
  selfLink: DS.attr('string'),
  type: DS.attr('string')
});

export default GoogleDrivePermission;