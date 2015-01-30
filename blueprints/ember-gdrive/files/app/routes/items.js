import Ember from 'ember';

export default Ember.Route.extend({
  title: 'Items',

  model: function() {
    return this.store.find('item');
  }
});
