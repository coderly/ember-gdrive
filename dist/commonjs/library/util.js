"use strict";
var normalizeTypeKey = function(typeKey) {
  return Ember.String.dasherize(typeKey);
};

var modelKey = function(model) {
  return normalizeTypeKey(model.typeKey);
};

var recordKey = function(record) {
  return modelKey(record.constructor);
};

var pluck = function(values, property) {
  return values.map(function(o) {
    return o[property];
  });
};

exports.normalizeTypeKey = normalizeTypeKey;
exports.modelKey = modelKey;
exports.recordKey = recordKey;
exports.pluck = pluck;