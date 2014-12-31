var ListReference = function (model, parent, key, data) {
  this.model = model;
  this.parent = parent;
  this.key = key;
  this.data = data;
};

ListReference.isFor = function (object) {
  return object &&
    object.hasOwnProperty('insertAll') &&
    object.hasOwnProperty('pushAll') &&
    object.hasOwnProperty('removeRange');
};

ListReference.serialize = function (object) {
  var serialized = [];
  object.asArray().forEach(function (item) {
    serialized.push(this.serialize(item));
  });
  return serialized;
};

export default ListReference;