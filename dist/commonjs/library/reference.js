"use strict";
var Ember = require("ember")["default"];

var isPlainObject = function(o) {
  // This doesn't work for basic objects such as Object.create(null)
  return Object(o) === o && Object.getPrototypeOf(o) === Object.prototype;
};

var get = function() {
  if (Ember.isArray(arguments[0]))
    return get.apply(this, arguments[0]);

  var components = arguments;
  var cur = this;
  for (var i = 0; i < components.length; i++) {
    cur = cur._get(components[i]);
  }
  return cur;
};

var MapReference = function(model, parent, key, data) {
  this.model = model;
  this.parent = parent;
  this.key = key;
  this.data = data;
};

MapReference.isFor = function(data) {
  return data instanceof gapi.drive.realtime.CollaborativeMap;
};

// this is used for debugging purposes to get a snapshot of the Google Drive data structure
MapReference.serialize = function(object) {
  var serialized = {};
  object.items().forEach(function(pair) {
    serialized[ pair[0] ] = serialize(pair[1]);
  });
  return serialized;
};

MapReference.prototype.path = function(key) {
  if (this.parent) {
    return this.parent.path(this.key) + (key ? '/' + key : '');
  }
  else {
    return key || '';
  }
};

MapReference.prototype.keys = function() {
  return this.data.keys();
};

MapReference.prototype.get = function(key, __components) {
  return get.apply(this, arguments);
};

MapReference.prototype._get = function(key) {
  var childData = this.data.get(key);
  if (NullReference.isFor(childData)) {
    return new NullReference(this.model, this, key);
  }
  else if (MapReference.isFor(childData)) {
    return new MapReference(this.model, this, key, childData);
  }
  else {
    return childData;
  }
};

MapReference.prototype.set = function(value) {
  if (arguments.length > 1) {
    if (arguments[1] !== undefined) {
      this.data.set(arguments[0], this._coerce(arguments[1]));
    }
  }
  else if (isPlainObject(value)) {

    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      if (value[keys[i]] !== undefined) {
        this.data.set( keys[i], value[keys[i]] );
      }
    }
  }
  else {
    this.parent.set(this.key, value);
  }

  return this.parent ? this.parent.get(this.key) : this;
};

MapReference.prototype.value = function() {
  return serialize(this.data);
};

MapReference.prototype.delete = function(key) {
  this.data.delete(key);
  return this;
};

MapReference.prototype.clear = function() {
  this.data.clear();
  return this;
};

MapReference.prototype.materialize = function() {
  return this;
};

MapReference.prototype.changed = function(handler) {
  this.data.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, handler);
  this.data.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, handler);
  return this;
};

MapReference.prototype._coerce = function(value) {
  if (isPlainObject(value)) {
    return this.model.createMap(value);
  }
  else {
    return value;
  }
};

MapReference.prototype.value = function() {
  return serialize(this.data);
};

var NullReference = function(model, parent, key) {
  this.model = model;
  this.parent = parent;
  this.key = key;
};

NullReference.isFor = function(data) {
  return data == null;
};

NullReference.prototype.path = function(key) {
  return this.parent.path(this.key) + (key ? '/' + key : '');
};

NullReference.prototype.keys = function() {
  return [];
};

NullReference.prototype.get = function(key, __components) {
  return get.apply(this, arguments);
};

NullReference.prototype._get = function(key) {
  return new NullReference(this.model, this, key);
};

NullReference.prototype.set = function(value) {
  var map = this.materialize();
  map.set(value);
  return map;
};

NullReference.prototype.delete = function(key) {
  return this;
};

NullReference.prototype.value = function() {
  return null;
};

NullReference.prototype.materialize = function() {
  var parent = this.parent.materialize();
  parent.set(
    this.key,
    this.model.createMap()
  );

  return parent.get(this.key);
};

NullReference.prototype.changed = function() {
  Ember.assert('You must materialize a NullReference before adding a listener to ' + this.path(), false);
};

var serializeList = function(object) {
  var serialized = [];
  object.asArray().forEach(function(item) {
    serialized.push( serialize(item) )
  });
  return serialized;
};

var serialize = function(object) {
  if (MapReference.isFor(object)) {
    return MapReference.serialize(object);
  }
  else if (object instanceof gapi.drive.realtime.CollaborativeList) {
    return serializeList(object);
  }
  else {
    return object;
  }
};

exports["default"] = MapReference;