'use strict';

var path = require('path');
var fs   = require('fs');

function EmberGdrive(project) {
  this.project = project;
  this.name    = 'Ember Gdrive';
}

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

EmberGdrive.prototype.treeFor = function treeFor(name) {
  var treePath =  path.join('node_modules', 'ember-gdrive', name + '-addon');

  if (fs.existsSync(treePath)) {
    return unwatchedTree(treePath);
  }
};

EmberGdrive.prototype.included = function included(app) {
  this.app = app;

  //this.app.import('vendor/ember-gdrive/styles/style.css');
};

module.exports = EmberGdrive;