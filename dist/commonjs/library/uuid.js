"use strict";
exports["default"] = function uuid() {
  var n = 10; // max n is 16
  return new Array(n+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, n)
}