import { recordKey } from './util';

var serializeRecordId = function(record) {
  return record.get('id');
};

var serializeRecordPolymorphicId = function(record) {
  return {
    id: record.get('id'),
    type: recordKey(record)
  }
};

var Serializer = DS.JSONSerializer.extend({

  serializeHasMany: function(record, json, relationship) {
    var key = relationship.key;
    var serializeId = relationship.options.polymorphic ? serializeRecordPolymorphicId : serializeRecordId;
    var rel = record.get(key);
    if(relationship.options.async){
      rel = rel.get('content');
    }
    if (rel){
      json[key] = rel.map(serializeId);
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    if (relationship.options && relationship.options.async){
      var key = relationship.key;
      json[key] = record.get(relationship.key).get('content.id');
    } else {
      this._super(record, json, relationship);
    }
  }

});

export default Serializer;