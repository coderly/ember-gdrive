"use strict";
DS.Store.reopen({
  undo: function() {
    this._defaultAdapter().undo();
  },
  redo: function() {
    this._defaultAdapter().redo();
  },
  beginSave: function(name) {
    this._defaultAdapter().beginSave(name);
  },
  endSave: function(name) {
    this._defaultAdapter().endSave(name);
  },
  beginOperation: function(name) {
    this._defaultAdapter().beginSave(name);
    window.autoSaveSuspended = true;
  },
  endOperation: function(name) {
    Ember.run.schedule('afterRender', this, function() {
      this._defaultAdapter().endSave(name);
      window.autoSaveSuspended = false;
    });
  },
  _defaultAdapter: function() {
    return this.container.lookup('adapter:application');
  }
});