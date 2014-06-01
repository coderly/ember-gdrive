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
  endSave: function() {
    this._defaultAdapter().endSave();
  },
  _defaultAdapter: function() {
    return this.container.lookup('adapter:application');
  }
});