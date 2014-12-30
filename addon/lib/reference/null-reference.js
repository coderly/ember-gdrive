import Ember from 'ember';
import get from 'ember-gdrive/lib/reference/get';

var NullReference = function (model, parent, key) {
  this.model = model;
  this.parent = parent;
  this.key = key;
};

NullReference.isFor = function (data) {
  return data === null;
};

NullReference.prototype.path = function (key) {
  return this.parent.path(this.key) + (key ? '/' + key : '');
};

NullReference.prototype.keys = function () {
  return [];
};

NullReference.prototype.get = function (key, __components) {
  return get.apply(this, arguments);
};

NullReference.prototype._get = function (key) {
  return new NullReference(this.model, this, key);
};

NullReference.prototype.set = function (value) {
  var map = this.materialize();
  map.set(value);
  return map;
};

NullReference.prototype.delete = function (key) {
  return this;
};

NullReference.prototype.value = function () {
  return null;
};

NullReference.prototype.materialize = function () {
  var parent = this.parent.materialize();
  parent.set(
    this.key,
    this.model.createMap()
  );

  return parent.get(this.key);
};

NullReference.prototype.changed = function () {
  Ember.assert('You must materialize a NullReference before adding a listener to ' + this.path(), false);
};

export default NullReference;