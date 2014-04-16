import Adapter from "ember-gdrive/adapter";
import Auth from "ember-gdrive/auth";
import Document from "ember-gdrive/document";
import DocumentSource from "ember-gdrive/document-source";
import FilePicker from "ember-gdrive/picker";
import Reference from "ember-gdrive/reference";
import ShareDialog from "ember-gdrive/share-dialog";
import State from "ember-gdrive/state";

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

export { GDrive };