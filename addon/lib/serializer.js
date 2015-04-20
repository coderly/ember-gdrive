import DS from 'ember-data';
import { recordKey } from 'ember-gdrive/lib/util';

function serializeId(snapshot, relationship) {
  if (!snapshot) {
    return null;
  }
  if (relationship.options.polymorphic) {
    return {
      id: snapshot.id,
      type: recordKey(snapshot)
    };
  }
  else {
    return snapshot.id;
  }
}

var Serializer = DS.JSONSerializer.extend({

  serializeHasMany: function(snapshot, json, relationship) {
    if(relationship.options.serialize === false) {
      return;
    }
    var key = relationship.key;
    var rel = snapshot.hasMany(key);

    if (rel){
      json[key] = rel.map(function(relatedSnapshot) {
        return serializeId(relatedSnapshot, relationship);
      });
    }
  },

  serializeBelongsTo: function(snapshot, json, relationship) {
    if(relationship.options.serialize === false) {
      return;
    }
    if (relationship.options && relationship.options.async){
      var key = relationship.key;
      var belongsTo = snapshot.belongsTo(key);
      json[key] = serializeId(belongsTo, relationship);
    } else {
      this._super(snapshot, json, relationship);
    }
  }
});

export default Serializer;