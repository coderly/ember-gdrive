import Ember from 'ember';

export default Ember.Controller.extend({

  isSharing: false,
  
  actions: {
    share: function () {
      this.set('isSharing', true);
    }
    
  }
});
