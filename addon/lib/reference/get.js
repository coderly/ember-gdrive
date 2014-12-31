import Ember from 'ember';

export default function () {
  if (Ember.isArray(arguments[0])) {
    return this.get.apply(this, arguments[0]);
  }

  var components = arguments;
  var cur = this;
  for (var i = 0; i < components.length; i++) {
    cur = cur._get(components[i]);
  }
  return cur;
}
