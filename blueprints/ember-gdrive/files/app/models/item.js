import DS from 'ember-data';

var Item = DS.Model.extend({
  name: DS.attr('string', { defaultValue: 'New item' }),
});

export default Item;
