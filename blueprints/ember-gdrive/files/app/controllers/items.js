import Ember from 'ember';

export default Ember.ArrayController.extend({
  newItemName: '',
  
  actions: {
    create: function () {
      var item = this.store.createRecord('item', { name: this.get('newItemName') }),
          controller = this;
      item.save().then(function() {
        controller.set('newItemName', '');
      });
    },
    
    delete: function (item) {
      item.destroyRecord();
    }
  }
});
