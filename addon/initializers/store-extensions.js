import Ember from 'ember';
import DS from 'ember-data';

export default {
  name: 'store-extensions',
  after: 'store',
  initialize: function () {
    DS.Store.reopen({
      undo: function () {
        this._defaultAdapter().undo();
      },
      redo: function () {
        this._defaultAdapter().redo();
      },
      beginSave: function (name) {
        this._defaultAdapter().beginSave(name);
      },
      endSave: function (name) {
        this._defaultAdapter().endSave(name);
      },
      beginOperation: function (name) {
        this._defaultAdapter().beginSave(name);
      },
      endOperation: function (name) {
        Ember.run.schedule('afterRender', this, function () {
          this._defaultAdapter().endSave(name);
        });
      },
      _defaultAdapter: function () {
        return this.container.lookup('adapter:application');
      }
    });
  }
};