var get = Ember.get;

var serializeRecordId = function(record) {
  return record.get('id');
};

var serializeRecordPolymorphicId = function(record) {
  return {
    id: record.get('id'),
    type: record.constructor.typeKey
  }
};

export default DS.JSONSerializer.extend({

  serializeHasMany: function(record, json, relationship) {
    var key = relationship.key,
      relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

    if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
      var serializeId = relationship.options.polymorphic ? serializeRecordPolymorphicId : serializeRecordId;
      json[key] = get(record, key).map(serializeId);
    }
  }

});
