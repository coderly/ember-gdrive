"use strict";
var loader = {};

loader.promise = null;
loader.loaded = 0;
loader.libraryCount = 4;

loader.load = function() {
  if (loader.promise)
    return loader.promise;

  loader.promise = new Ember.RSVP.Promise(function(resolve, reject) {
    gapi.load('auth:client,drive-realtime,drive-share', function() {

      gapi.client.load('oauth2', 'v2', function() {
        loader.loaded++;
        if (loader.loaded >= loader.libraryCount) resolve();
      });

      gapi.client.load('drive', 'v2', function() {
        loader.loaded++;
        if (loader.loaded >= loader.libraryCount) resolve();
      });

      gapi.load('drive-share', function() {
        loader.loaded++;
        if (loader.loaded >= loader.libraryCount) resolve();
      });

      gapi.load('picker', function() {
        loader.loaded++;
        if (loader.loaded >= loader.libraryCount) resolve();
      });

    });
  });

  return loader.promise;
};


exports["default"] = loader;