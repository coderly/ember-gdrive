import DS from 'ember-data';
import { recordKey } from 'ember-gdrive/lib/util';

function serializeId(record, relationship) {
  if (!record) {
    return null;
  }
  if (relationship.options.polymorphic) {
    return {
      id: record.get('id'),
      type: recordKey(record)
    };
  }
  else {
    return record.get('id');
  }
}

var Serializer = DS.JSONSerializer.extend({

  serializeHasMany: function(record, json, relationship) {
    if(relationship.options.serialize === false) {
      return;
    }
    var key = relationship.key;
    var rel = record.get(key);

    if(relationship.options.async && rel){
      rel = record._relationships[key].manyArray.toArray();
    }

    if (rel){
      json[key] = rel.map(function(record) {
        return serializeId(record, relationship);
      });
    }
  },

  serializeBelongsTo: function(record, json, relationship) {
    if(relationship.options.serialize === false) {
      return;
    }
    if (relationship.options && relationship.options.async){
      var key = relationship.key;
      var belongsTo = record._relationships[key].inverseRecord;
      json[key] = serializeId(belongsTo, relationship);
    } else {
      this._super(record, json, relationship);
    }
  },
  
  normalizePayload: function(payload) {
    return JSON.parse(JSON.stringify(payload));
  }
});

export default Serializer;