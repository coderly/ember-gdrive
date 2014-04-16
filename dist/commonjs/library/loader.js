"use strict";
var loader = {};

loader.load = function() {
  var loaded = 0, libraryCount = 4;

  return new Ember.RSVP.Promise(function(resolve, reject) {
    gapi.load('auth:client,drive-realtime,drive-share', function() {

      gapi.client.load('oauth2', 'v2', function() {
        loaded++;
        if (loaded >= libraryCount) resolve();
      });

      gapi.client.load('drive', 'v2', function() {
        loaded++;
        if (loaded >= libraryCount) resolve();
      });

      gapi.load('drive-share', function() {
        loaded++;
        if (loaded >= libraryCount) resolve();
      });

      gapi.load('picker', function() {
        loaded++;
        if (loaded >= libraryCount) resolve();
      });

    });
  });
};

exports["default"] = loader;