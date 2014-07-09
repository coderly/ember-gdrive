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
    var key = relationship.key,
        relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      var serializeId = relationship.options.polymorphic ? serializeRecordPolymorphicId : serializeRecordId;
      json[key] = Ember.get(record, key).map(serializeId);
    }
  }

});

export default Serializer;