"use strict";
var Adapter = require("./my_library/adapter")["default"];
var Auth = require("./my_library/auth")["default"];
var Document = require("./my_library/docyment")["default"];

var GDrive = {
  Adapter: Adapter,
  Auth: Auth,
  Document: Document
};

exports.GDrive = GDrive;