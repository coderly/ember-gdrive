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

exports.normalizeTypeKey = normalizeTypeKey;
exports.modelKey = modelKey;
exports.recordKey = recordKey;