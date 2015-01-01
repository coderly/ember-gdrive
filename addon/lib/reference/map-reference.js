import NullReference from 'ember-gdrive/lib/reference/null-reference';
import get from 'ember-gdrive/lib/reference/get';

var MapReference = function (model, parent, key, data) {
  this.model = model;
  this.parent = parent;
  this.key = key;
  this.data = data;
};

var _isPlainObject = function (o) {
  // This doesn't work for basic objects such as Object.create(null)
  return Object(o) === o && Object.getPrototypeOf(o) === Object.prototype;
};

var _serialize = function (object) {
  if (MapReference.isFor(object)) {
    return MapReference.serialize(object);
  } else {
    return object;
  }
};

MapReference.isFor = function (data) {
  //return data instanceof gapi.drive.realtime.CollaborativeMap;
  return data &&
    data.hasOwnProperty('size') &&
    data.hasOwnProperty('keys') &&
    data.hasOwnProperty('values');
};

// this is used for debugging purposes to get a snapshot of the Google Drive data structure
MapReference.serialize = function (object) {
  var serialized = {};
  object.items().forEach(function (pair) {
    if (pair[1] instanceof Array) {
      // gapi returns array properties with non-writable elements, so we need to remap them as a temporary fix
      serialized[pair[0]] = _serialize(pair[1]).map(function (item) {
        return item;
      });
    } else {
      serialized[pair[0]] = _serialize(pair[1]);
    }
  });
  return serialized;
};

MapReference.prototype.path = function (key) {
  if (this.parent) {
    return this.parent.path(this.key) + (key ? '/' + key : '');
  } else {
    return key || '';
  }
};

MapReference.prototype.keys = function () {
  return this.data.keys();
};

MapReference.prototype.get = function (key, __components) {
  return get.apply(this, arguments);
};

MapReference.prototype._get = function (key) {
  var childData = this.data.get(key);
  
  if (NullReference.isFor(childData)) {
    return new NullReference(this.model, this, key);
  } else if (MapReference.isFor(childData)) {
    return new MapReference(this.model, this, key, childData);
  } else {
    return childData;
  }
};

MapReference.prototype.set = function (value) {
  if (arguments.length > 1) {
    if (arguments[1] !== undefined) {
      this.data.set(arguments[0], this._coerce(arguments[1]));
    }
  } else if (_isPlainObject(value)) {

    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      if (value[keys[i]] !== undefined) {
        this.data.set(keys[i], value[keys[i]]);
      }
    }
  } else {
    this.parent.set(this.key, value);
  }

  return this.parent ? this.parent.get(this.key) : this;
};

MapReference.prototype.value = function () {
  return _serialize(this.data);
};

MapReference.prototype.delete = function (key) {
  this.data.delete(key);
  return this;
};

MapReference.prototype.clear = function () {
  this.data.clear();
  return this;
};

MapReference.prototype.materialize = function () {
  return this;
};

MapReference.prototype.changed = function (handler) {
  this.data.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, handler);
  this.data.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, handler);
  return this;
};

MapReference.prototype._coerce = function (value) {
  if (_isPlainObject(value)) {
    return this.model.createMap(value);
  } else {
    return value;
  }
};

export default MapReference;
