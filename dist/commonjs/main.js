"use strict";
var Adapter = require("./my_library/adapter")["default"];
var Auth = require("./my_library/auth")["default"];
var Document = require("./my_library/document")["default"];
var DocumentSource = require("./my_library/document-source")["default"];
var FilePicker = require("./my_library/picker")["default"];
var Reference = require("./my_library/reference")["default"];
var ShareDialog = require("./my_library/share-dialog")["default"];
var State = require("./my_library/state")["default"];

var GDrive = {
  Adapter: Adapter,
  Auth: Auth,
  Document: Document,
  DocumentSource: DocumentSource,
  FilePicker: FilePicker,
  Reference: Reference,
  ShareDialog: ShareDialog,
  State: State
};

exports.GDrive = GDrive;