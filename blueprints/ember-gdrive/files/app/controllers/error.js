import Ember from 'ember';

var NOT_FOUND_REGEX = /The file was not found\. It does not exist or you do not have read access to the file\./;

export default Ember.ObjectController.extend({

  isAccessError: function(){
    var message = this.get('message');
    return (NOT_FOUND_REGEX.test(message));
  }.property('message')

});
