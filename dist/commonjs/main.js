"use strict";
var Adapter = require("ember-gdrive/adapter")["default"];
var Auth = require("ember-gdrive/auth")["default"];
var Document = require("ember-gdrive/document")["default"];
var DocumentSource = require("ember-gdrive/document-source")["default"];
var FilePicker = require("ember-gdrive/picker")["default"];
var Reference = require("ember-gdrive/reference")["default"];
var ShareDialog = require("ember-gdrive/share-dialog")["default"];
var State = require("ember-gdrive/state")["default"];

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