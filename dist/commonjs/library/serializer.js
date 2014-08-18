"use strict";
var recordKey = require("./util").recordKey;

function serializeId(record, relationship) {
  if (relationship.options.polymorphic) {
    return {
      id: record.get('id'),
      type: recordKey(record)
    }
  }
  else {
    return record.get('id');
  }
}

var Serializer = DS.JSONSerializer.extend({

  serializeHasMany: function(record, json, relationship) {
    var key = relationship.key;
    var rel = record.get(key);
    var shouldSerialize = true;

    if(relationship.options.async && rel && !rel.get('isFulfilled')) {
      shouldSerialize = false;
    }

     if(relationship.options.async && rel && rel.get('isFulfilled')){
      rel = rel.get('content');
    }

    if (rel && shouldSerialize){
      json[key] = rel.map(function(record) {
        return serializeId(record, relationship);
      });
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    if (relationship.options && relationship.options.async){
      var key = relationship.key;
      if (record.get(key).get('isFulfilled')) {
        json[key] = serializeId(record.get(key).get('content'), relationship);
      }
    } else {
      this._super(record, json, relationship);
    }
  }

});

exports["default"] = Serializer;