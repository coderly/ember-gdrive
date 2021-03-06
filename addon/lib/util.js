import Ember from 'ember';

var normalizeTypeKey = function(typeKey) {
  return Ember.String.dasherize(typeKey);
};

var modelKey = function(model) {
  return normalizeTypeKey(model.typeKey);
};

var recordKey = function(snapshot) {
  return modelKey(snapshot.type);
};

var pluck = function(values, property) {
  return values.map(function(o) {
    return o[property];
  });
};

export { normalizeTypeKey, modelKey, recordKey, pluck };
