define("ember-gdrive/adapter", 
  ["./uuid","./document","./change-observer","./util","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var uuid = __dependency1__["default"];
    var Document = __dependency2__["default"];
    var ChangeObserver = __dependency3__["default"];

    var modelKey = __dependency4__.modelKey;

    var Adapter = DS.Adapter.extend({
      defaultSerializer: '-google-drive',

      documentSource: null,
      document: Ember.computed.alias('documentSource.document'),
      namespace: 'v1',

      ref: function() {
        var ref = this.get('document.ref'),
            namespace = this.get('namespace');

        return ref.get(namespace).materialize();
      }.property('document.ref', 'namespace'),

      recordCreatedRemotely: function(store, typeKey, data) {
        store.push(typeKey, data);
      },
      recordUpdatedRemotely: function(store, typeKey, data) {
        store.push(typeKey, data);
      },
      recordDeletedRemotely: function(store, typeKey, id) {
        var deletedRecord = store.getById(typeKey, id);
        store.unloadRecord(deletedRecord);
      },

      recordCreatedLocally: function(store, typeKey, data) {
        store.push(typeKey, data);
      },
      recordUpdatedLocally: function(store, typeKey, data, e) {
        store.push(typeKey, data);
      },
      recordDeletedLocally: function(store, typeKey, id) {
        var deletedRecord = store.getById(typeKey, id);
        if (deletedRecord && !deletedRecord.get('isDeleted')) {
          deletedRecord.destroyRecord();
        }
      },

      changeObserver: function() {
        return ChangeObserver.create({ ref: this.get('ref'), target: this });
      }.property(),

      observeRecordData: function(store, typeKey, id) {
        return this.get('changeObserver').observeRecordData(store, typeKey, id)
      },

      observeIdentityMap: function(store, typeKey) {
        return this.get('changeObserver').observeIdentityMap(store, typeKey)
      },

      generateIdForRecord: function(store, record) {
        return uuid();
      },

      find: function(store, type, id) {
        this.observeRecordData(store, type.typeKey, id);
        return Ember.RSVP.resolve( this.get('ref').get(modelKey(type), id).value() );
      },

      createRecord: function(store, type, record) {
        var serializedRecord = record.serialize({includeId: true}),
            id = record.get('id'),
            ref = this.get('ref');

        this.beginSave('createRecord');
        ref.get(modelKey(type), id).set(serializedRecord);
        this.endSave('createRecord');

        this.observeRecordData(store, type.typeKey, id);

        return Ember.RSVP.resolve( this.get('ref').get(modelKey(type), id).value() );
      },

      updateRecord: function(store, type, record) {
        var serializedRecord = record.serialize({includeId: true}),
            id = record.get('id'),
            ref = this.get('ref');

        this.beginSave('updateRecord');
        ref.get(modelKey(type), id).set(serializedRecord);
        this.endSave('updateRecord');

        this.observeRecordData(store, type.typeKey, id);

        return Ember.RSVP.resolve( ref.get(modelKey(type), id).value() );
      },

      findAll: function(store, type) {
        var adapter = this,
            ref = this.get('ref'),
            identityMap = ref.get(modelKey(type)).value() || {},
            keys = ref.get(modelKey(type)).keys(),
            serializedRecords = [];

        for (var i = 0; i < keys.length; i++) {
          serializedRecords.push( identityMap[ keys[i] ] );
        }

        this.observeIdentityMap(store, type.typeKey);

        serializedRecords.forEach(function(data) {
          adapter.observeRecordData(store, type.typeKey, data.id);
        });

        return Ember.RSVP.resolve( serializedRecords );
      },

      deleteRecord: function(store, type, record) {
        var ref = this.get('ref');
        var id = record.get('id');
        ref.get(modelKey(type)).delete(id);
        return Ember.RSVP.resolve();
      },

      undo: function() {
        this.get('document').undo();
      },

      redo: function() {
        this.get('document').redo();
      },

      beginSave: function(name) {
        this.get('document').beginSave(name);
      },

      endSave: function(name) {
        this.get('document').endSave(name);
      }
    });

    __exports__["default"] = Adapter;
  });
define("ember-gdrive/auth", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install',
        FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file',
        OPENID_SCOPE = 'openid';

    var merge = function(a, b) {
      return Ember.merge(a || {}, b || {});
    };

    var Auth = Ember.Object.extend();

    Auth.reopenClass({
      isAuthenticated: false,
      isUnauthenticated: Ember.computed.not('isAuthenticated'),

      user: null,
      userID: Ember.computed.alias('user.id'),

      clientID: ENV.GOOGLE_CLIENT_ID,
      permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

      authorize: function(options) {
        var finalOptions = merge({
          client_id: this.clientID,
          scope: this.permissions,
          authuser: -1,
          immediate: false
        }, options || {});

        return new Ember.RSVP.Promise(function(resolve, reject) {
          console.log('authorize', finalOptions);
          gapi.auth.authorize(finalOptions, function(result) {
            if (result && !result.error) {
              Ember.run(null, resolve, result);
            } else {
              Ember.run(null, reject, result && result.error ? result.error : 'unauthenticated');
            }
          });
        }, 'ember-gdrive: Auth#authorize');
      },

      authorizeImmediate: function(options) {
        return this.authorize(merge({
          immediate: true
        }, options));
      },

      fetchCurrentUser: function() {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          gapi.client.oauth2.userinfo.get().execute(function(user) {
            if (user.id) {
              Ember.run(null, resolve, user);
            }
            else {
              Ember.run(null, reject);
            }
          });
        }, 'GoogleDriveAuth _fetchUserObject');
      },

      close: function(){
        return new Ember.RSVP.Promise(function(resolve){
          gapi.auth.signOut();
          resolve();
        });
      }

    });

    __exports__["default"] = Auth;
  });
define("ember-gdrive/boot", 
  ["ember-gdrive/auth","ember-gdrive/document-source","ember-gdrive/loader","ember-gdrive/adapter","ember-gdrive/serializer"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var GoogleDriveAuth = __dependency1__["default"];
    var DocumentSource = __dependency2__["default"];
    var loader = __dependency3__["default"];

    var GoogleDriveAdapter = __dependency4__["default"];
    var GoogleDriveSerializer = __dependency5__["default"];

    /**
     Register the serializer and adapter
     */
    Ember.onLoad('Ember.Application', function(Application) {

      Application.initializer({
        name: 'google-drive',
        after: 'store',
        initialize: function(container, application) {
          application.register('adapter:-google-drive', GoogleDriveAdapter);
          application.register('serializer:-google-drive', GoogleDriveSerializer);

          application.register('document-source:main', DocumentSource);

          application.inject('route', 'documentSource', 'document-source:main');
          application.inject('controller', 'documentSource', 'document-source:main');
          application.inject('adapter:application', 'documentSource', 'document-source:main');
        }
      });

      Application.initializer({
        name: 'requireGoogleLibraries',
        before: 'googleDriveAuth',
        initialize: function(container, application) {
          application.deferReadiness();
          loader.load().then(function() {
            application.advanceReadiness();
          });
        }
      });

      //@TODO: remove
      Application.initializer({
        name: "googleDriveAuth",
        before: "store",

        initialize: function(container, application) {
          application.register('auth:google', GoogleDriveAuth, {instantiate: false});

          application.inject('controller', 'auth', 'auth:google');
          application.inject('route', 'auth', 'auth:google');
        }
      });

    });
  });
define("ember-gdrive/change-observer", 
  ["./util","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var normalizeTypeKey = __dependency1__.normalizeTypeKey;
    var pluck = __dependency1__.pluck;

    function logEventToConsole(e) {
      console.log({
        type: e.type,
        property: e.property,
        oldValue: e.oldValue,
        newValue: e.newValue,
        isLocal: e.isLocal,
        bubbles: e.bubbles,
        sessionId: e.sessionId,
        userId: e.userId
      });
    }

    function logEventToBlackHole(e) {}

    var logEvent = logEventToBlackHole;

    __exports__["default"] = Ember.Object.extend(Ember.ActionHandler, {
      ref: null,
      target: null,
      observedMap: function() { return {} }.property(),

      observeRecordData: function(store, typeKey, id) {
        var observer = this,
            observedMap = this.get('observedMap'),
            key = [normalizeTypeKey(typeKey), id].join('/'),
            ref = this.get('ref');

        if (observedMap[key]) {
          return Ember.RSVP.Promise.resolve();
        }
        else {
          observedMap[key] = true; // can set this to the promise and return that every time
        }

        ref.get(normalizeTypeKey(typeKey), id).changed(function(e) {
          if (e.type == 'value_changed') {
            Ember.run(function(){
              observer.recordDataChanged(store, typeKey, id, e);
            });
          }
        });
      },

      observeIdentityMap: function(store, typeKey) {
        var observer = this,
            observedMap = this.get('observedMap'),
            key = [normalizeTypeKey(typeKey)].join('/'),
            ref = this.get('ref');

        if (observedMap[key]) {
          return Ember.RSVP.Promise.resolve();
        }
        else {
          observedMap[key] = true;
        }

        ref.get(normalizeTypeKey(typeKey)).materialize().changed(function(e) {
          if (e.type == 'value_changed') {
            Ember.run.once(observer, 'identityMapChanged', store, typeKey, e);
          }
        });
      },

      recordDataChanged: function(store, typeKey, id, e) {
        logEvent(e);

        var ref = this.get('ref');
        var data = ref.get(normalizeTypeKey(typeKey), id).value();

        // if a record is getting deleted its attributes will all get set to null
        // shouldn't be raising update events after a record gets deleted
        if (!data) {
          return;
        }

        if (e.isLocal) {
          this.get('target').recordUpdatedLocally(store, typeKey, data);
        }
        else {
          this.get('target').recordUpdatedRemotely(store, typeKey, data);
        }
      },

      identityMapChanged: function(store, typeKey, e) {
        logEvent(e);

        var ref = this.get('ref');
        var data, newRecordId;


        if (e.isLocal && e.oldValue == null && e.newValue) {
          newRecordId = e.newValue.get('id');
          data = ref.get(normalizeTypeKey(typeKey), newRecordId).value();
          this.get('target').recordCreatedLocally(store, typeKey, data);
        }

        else if (e.isLocal && e.oldValue && e.newValue == null) {
          this.get('target').recordDeletedLocally(store, typeKey, e.oldValue.get('id'));
        }

        else if (!e.isLocal && e.oldValue == null && e.newValue) {
          newRecordId = e.newValue.get('id');
          data = ref.get(normalizeTypeKey(typeKey), newRecordId).value();

          this.get('target').recordCreatedRemotely(store, typeKey, data);
        }

        else if (!e.isLocal && e.oldValue && e.newValue == null) {
          var deletedRecordId = e.oldValue.get('id');
          this.get('target').recordDeletedRemotely(store, typeKey, deletedRecordId);
        }
      }

    });
  });
define("ember-gdrive/document-source", 
  ["./document","./state","./loader","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Document = __dependency1__["default"];
    var State = __dependency2__["default"];
    var loader = __dependency3__["default"];

    var DocumentSource = Ember.Object.extend({
      document: null,
      id: Ember.computed.alias('document.id'),
      isLoaded: Ember.computed.bool('id'),

      state: function() {
        return State.create();
      }.property(),

      openFromState: function() {
        var state = this.get('state');
        if (state.get('isOpen')) {
          return this.load(state.get('fileID'));
        }
        else {
          return Ember.RSVP.Promise.reject('failed to open');
        }
      },

      createFromState: function() {
        var state = this.get('state');
        var documentSource = this;

        if (state.get('isCreate')) {
          var title = prompt('Enter a document name') || 'Untitled document';

          return Document.create({title: title}).then(function(doc) {
            documentSource.set('document', doc);
            return doc;
          });
        } else {
          return Ember.RSVP.Promise.reject('failed to create');
        }
      },

      load: function(documentId) {
        Ember.assert('Document with id ' + this.get('id') + ' was already loaded', !this.get('isLoaded'));

        var documentSource = this;
        return Document.find( documentId ).then(function(doc) {
          documentSource.set('document', doc);
          return doc;
        });
      }

    });

    __exports__["default"] = DocumentSource;
  });
define("ember-gdrive/document", 
  ["./reference","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Reference = __dependency1__["default"];

    var Document = Ember.Object.extend(Ember.Evented, {
      id: null,
      content: null,
      title: Ember.computed.alias('meta.title'),

      hasUnsavedChanges: false,
      isSaving: false,

      canUndo: false,
      canRedo: false,

      collaborators: function() { return [] }.property(),

      isSaved: function() {
        return !this.get('hasUnsavedChanges') && !this.get('isSaving');
      }.property('hasUnsavedChanges', 'isSaving'),

      init: function(googleDocument, documentId) {
        Ember.assert('You must pass in a valid google document.', !!googleDocument);

        this.set('content', googleDocument);
        this.set('id', documentId);

        this._observeSaveState();
        this._observeUndoRedoState();
        this._observeCollaborators();

        this._refreshCollaborators();

        this._loadMeta();
      },

      ref: function() {
        var googleDocument = this.get('content');
        var model = googleDocument.getModel();
        var root = model.getRoot();

        return new Reference(model, null, null, root);
      }.property('content').readOnly(),

      meta: {},

      /* undo/redo */

      beginSave: function(name) {
        this.get('content').getModel().beginCompoundOperation();
      },

      endSave: function(name) {
        this.get('content').getModel().endCompoundOperation();
      },

      undo: function() {
        if (this.get('canUndo')) {
          this.get('content').getModel().undo();
        }
      },

      redo: function() {
        if (this.get('canRedo')) {
          this.get('content').getModel().redo();
        }
      },

      _observeSaveState: function() {
        var document = this;
        var googleDocument = this.get('content');
        googleDocument.addEventListener(gapi.drive.realtime.EventType.DOCUMENT_SAVE_STATE_CHANGED, function(e) {
          document.set('hasUnsavedChanges', e.isPending);
          document.set('isSaving', e.isSaving);
          if (document.get('isSaved')) {
            document.trigger('saved');
          }
        });
      },

      _observeUndoRedoState: function() {
        var document = this;
        var googleDocument = this.get('content');
        googleDocument.getModel().addEventListener(gapi.drive.realtime.EventType.UNDO_REDO_STATE_CHANGED, function(e) {
          document.set('canUndo', e.canUndo);
          document.set('canRedo', e.canRedo);
        });
      },

      _observeCollaborators: function() {
        var document = this;
        var googleDocument = this.get('content');

        googleDocument.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, function(e) {
          document._refreshCollaborators();
        });

        googleDocument.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function(e) {
          document._refreshCollaborators();
        });
      },

      _refreshCollaborators: function() {
        var collaborators = this.get('collaborators');
        var googleDocument = this.get('content');

        collaborators.clear();
        collaborators.pushObjects( googleDocument.getCollaborators() );
      },

      _loadMeta: function() {
        var document = this;
        this._fetchMeta(this.get('id')).then(function(meta) {
          document.set('meta', meta);
        });
      },

      _fetchMeta: function(documentId) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          gapi.client.drive.files.get({fileId: documentId}).execute(function(googleFileMeta) {
            if (googleFileMeta.error) {
              reject(googleFileMeta);
            }
            else {
              resolve(googleFileMeta);
            }
          });
        });
      }

    });

    var loadPromises = {};

    Document.reopenClass({
      find: function(documentId) {
        if (loadPromises[documentId])
          return loadPromises[documentId];

        loadPromises[documentId] = new Ember.RSVP.Promise(function(resolve, reject){
          gapi.drive.realtime.load(documentId,
            function(d) { Ember.run(null, resolve, d); },
            Ember.K,
            function(e) { Ember.run(null, reject, e); }
          );
        }).then(function(googleDocument) {
            return new Document(googleDocument, documentId);
          }, function(e) {
            delete loadPromises[documentId]; // don't store error promises so they can be retried
            console.log('oh my, gonna make an error');

            if(e.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
              throw new Error('Token refresh required');
            } else if(e.type == gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
              throw new Error("An Error happened: " + e.message);
            } else if(e.type == gapi.drive.realtime.ErrorType.NOT_FOUND) {
              throw new Error("The file was not found. It does not exist or you do not have read access to the file.");
            }
            else {
              throw new Error("Unknown error occured'")
            }
          });

        return loadPromises[documentId];
      },
      create: function(params) {
        return this._sendCreateRequest(params).then(function(googleFile) {
          if (googleFile.error) {
            return Ember.RSVP.reject(new Error(googleFile.error.message));
          }
          else {
            return Document.find(googleFile.id);
          }
        });
      },
      _sendCreateRequest: function(params) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          gapi.client.drive.files.insert({
            'resource': {
              mimeType: ENV.GOOGLE_MIME_TYPE,
              title: Ember.get(params, 'title')
            }
          }).execute(function(d){ Ember.run(null, resolve, d); });
        });
      }
    });

    __exports__["default"] = Document;
  });
define("ember-gdrive/loader", 
  ["exports"],
  function(__exports__) {
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

    loader.load();

    __exports__["default"] = loader;
  });
define("ember-gdrive/picker", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.Object.extend(Ember.Evented, {
      token: null,
      apiKey: ENV.GOOGLE_API_KEY,
      mimeTypes: ENV.GOOGLE_MIME_TYPE,

      show: function() {
        this.get('googlePicker').setVisible(true);
      },

      googlePicker: function() {
        var callback = this.googlePickerCallback.bind(this),
            token = this.get('token'),
            apiKey = this.get('apiKey'),
            mimeTypes = this.get('mimeTypes');

        var view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes(mimeTypes);

        return new google.picker.PickerBuilder()
          .addView(view)
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .setDeveloperKey(apiKey)
          .setSelectableMimeTypes(mimeTypes)
          .setOAuthToken(token)
          .setCallback(callback)
          .build();
      }.property('token'),

      googlePickerCallback: function(result) {
        if (result.action == google.picker.Action.PICKED) {
          this.trigger('selected', result.docs[0]);
        }
      }

    });
  });
define("ember-gdrive/reference", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    var isPlainObject = function(o) {
      // This doesn't work for basic objects such as Object.create(null)
      return Object(o) === o && Object.getPrototypeOf(o) === Object.prototype;
    };

    var get = function() {
      if (Ember.isArray(arguments[0]))
        return get.apply(this, arguments[0]);

      var components = arguments;
      var cur = this;
      for (var i = 0; i < components.length; i++) {
        cur = cur._get(components[i]);
      }
      return cur;
    };

    var MapReference = function(model, parent, key, data) {
      this.model = model;
      this.parent = parent;
      this.key = key;
      this.data = data;
    };

    MapReference.isFor = function(data) {
      return data instanceof gapi.drive.realtime.CollaborativeMap;
    };

    // this is used for debugging purposes to get a snapshot of the Google Drive data structure
    MapReference.serialize = function(object) {
      var serialized = {};
      object.items().forEach(function(pair) {
        serialized[ pair[0] ] = serialize(pair[1]);
      });
      return serialized;
    };

    MapReference.prototype.path = function(key) {
      if (this.parent) {
        return this.parent.path(this.key) + (key ? '/' + key : '');
      }
      else {
        return key || '';
      }
    };

    MapReference.prototype.keys = function() {
      return this.data.keys();
    };

    MapReference.prototype.get = function(key, __components) {
      return get.apply(this, arguments);
    };

    MapReference.prototype._get = function(key) {
      var childData = this.data.get(key);
      if (NullReference.isFor(childData)) {
        return new NullReference(this.model, this, key);
      }
      else if (MapReference.isFor(childData)) {
        return new MapReference(this.model, this, key, childData);
      }
      else {
        return childData;
      }
    };

    MapReference.prototype.set = function(value) {
      if (arguments.length > 1) {
        if (arguments[1] !== undefined) {
          this.data.set(arguments[0], this._coerce(arguments[1]));
        }
      }
      else if (isPlainObject(value)) {

        var keys = Object.keys(value);
        for (var i = 0; i < keys.length; i++) {
          if (value[keys[i]] !== undefined) {
            this.data.set( keys[i], value[keys[i]] );
          }
        }
      }
      else {
        this.parent.set(this.key, value);
      }

      return this.parent ? this.parent.get(this.key) : this;
    };

    MapReference.prototype.value = function() {
      return serialize(this.data);
    };

    MapReference.prototype.delete = function(key) {
      this.data.delete(key);
      return this;
    };

    MapReference.prototype.clear = function() {
      this.data.clear();
      return this;
    };

    MapReference.prototype.materialize = function() {
      return this;
    };

    MapReference.prototype.changed = function(handler) {
      this.data.addEventListener(gapi.drive.realtime.EventType.OBJECT_CHANGED, handler);
      this.data.addEventListener(gapi.drive.realtime.EventType.VALUE_CHANGED, handler);
      return this;
    };

    MapReference.prototype._coerce = function(value) {
      if (isPlainObject(value)) {
        return this.model.createMap(value);
      }
      else {
        return value;
      }
    };

    MapReference.prototype.value = function() {
      return serialize(this.data);
    };

    var NullReference = function(model, parent, key) {
      this.model = model;
      this.parent = parent;
      this.key = key;
    };

    NullReference.isFor = function(data) {
      return data == null;
    };

    NullReference.prototype.path = function(key) {
      return this.parent.path(this.key) + (key ? '/' + key : '');
    };

    NullReference.prototype.keys = function() {
      return [];
    };

    NullReference.prototype.get = function(key, __components) {
      return get.apply(this, arguments);
    };

    NullReference.prototype._get = function(key) {
      return new NullReference(this.model, this, key);
    };

    NullReference.prototype.set = function(value) {
      var map = this.materialize();
      map.set(value);
      return map;
    };

    NullReference.prototype.delete = function(key) {
      return this;
    };

    NullReference.prototype.value = function() {
      return null;
    };

    NullReference.prototype.materialize = function() {
      var parent = this.parent.materialize();
      parent.set(
        this.key,
        this.model.createMap()
      );

      return parent.get(this.key);
    };

    NullReference.prototype.changed = function() {
      Ember.assert('You must materialize a NullReference before adding a listener', false);
    };

    var serializeList = function(object) {
      var serialized = [];
      object.asArray().forEach(function(item) {
        serialized.push( serialize(item) )
      });
      return serialized;
    };

    var serialize = function(object) {
      if (MapReference.isFor(object)) {
        return MapReference.serialize(object);
      }
      else if (object instanceof gapi.drive.realtime.CollaborativeList) {
        return serializeList(object);
      }
      else {
        return object;
      }
    };

    __exports__["default"] = MapReference;
  });
define("ember-gdrive/serializer", 
  ["./util","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var recordKey = __dependency1__.recordKey;

    function serializeId(record, relationship) {
      if (relationship.options.polymorphic) {
        return {
          id: record.get('id'),
          type: recordKey(record)
        }
      }
      else {
        return record.get('id');
      }
    }

    var Serializer = DS.JSONSerializer.extend({

      serializeHasMany: function(record, json, relationship) {
        var key = relationship.key;
        var rel = record.get(key);
        var shouldSerialize = true;

        if(relationship.options.async && rel && !rel.get('isFulfilled')) {
          shouldSerialize = false;
        }

         if(relationship.options.async && rel && rel.get('isFulfilled')){
          rel = rel.get('content');
        }

        if (rel && shouldSerialize){
          json[key] = rel.map(function(record) {
            return serializeId(record, relationship);
          });
        }
      },

      serializeBelongsTo: function(record, json, relationship) {
        if (relationship.options && relationship.options.async){
          var key = relationship.key;
          if (record.get(key).get('isFulfilled')) {
            json[key] = serializeId(record.get(key).get('content'), relationship);
          }
        } else {
          this._super(record, json, relationship);
        }
      }

    });

    __exports__["default"] = Serializer;
  });
define("ember-gdrive/share-dialog", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.Object.extend({
      documentId: Ember.required(),
      show: function() {
        var shareClient = new gapi.drive.share.ShareClient(ENV.GOOGLE_DRIVE_SDK_APP_ID);

        shareClient.setItemIds([ this.get('documentId') ]);
        shareClient.showSettingsDialog();
      }
    });
  });
define("ember-gdrive/state", 
  ["./uri","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var extractQueryParams = __dependency1__.extractQueryParams;
    var clearQueryString = __dependency1__.clearQueryString;

    __exports__["default"] = Ember.Object.extend({

      init: function() {
        this.set('queryParams', extractQueryParams());
        clearQueryString();
      },

      fileID: function() {
        return this.get('fileIDs').objectAt(0);
      }.property('fileIDs'),

      isOpen: function() {
        return this.get('action') == 'open';
      }.property('action'),

      isCreate: function() {
        return this.get('action') == 'create';
      }.property('action'),

      state: function() {
        try {
          return JSON.parse(this.get('queryParams.state'));
        } catch (e) {
          return null;
        }
      }.property('queryParams'),

      action: Ember.computed.alias('state.action'),
      userID: Ember.computed.alias('state.userId'),
      fileIDs: Ember.computed.alias('state.ids'),
      folderID: Ember.computed.alias('state.folderId'),

      queryParams: {}

    });
  });
define("ember-gdrive/store-extensions", 
  [],
  function() {
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
      },
      endOperation: function(name) {
        Ember.run.schedule('afterRender', this, function() {
          this._defaultAdapter().endSave(name);
        });
      },
      _defaultAdapter: function() {
        return this.container.lookup('adapter:application');
      }
    });
  });
define("ember-gdrive/uri", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var extractQueryParams = function() {
      var params = {};
      location.search.substr(1).split("&").forEach(function(item) {
        params[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
      });
      return params;
    };

    var clearQueryString = function() {
      var uri = window.location.toString();
      if (uri.indexOf('?') > 0) {
        var cleanUri = uri.substring(0, uri.indexOf('?'));
        window.history.replaceState({}, document.title, cleanUri);
      }
    };

    __exports__.extractQueryParams = extractQueryParams;
    __exports__.clearQueryString = clearQueryString;
  });
define("ember-gdrive/util", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var normalizeTypeKey = function(typeKey) {
      return Ember.String.dasherize(typeKey);
    };

    var modelKey = function(model) {
      return normalizeTypeKey(model.typeKey);
    };

    var recordKey = function(record) {
      return modelKey(record.constructor);
    };

    var pluck = function(values, property) {
      return values.map(function(o) {
        return o[property];
      });
    };

    __exports__.normalizeTypeKey = normalizeTypeKey;
    __exports__.modelKey = modelKey;
    __exports__.recordKey = recordKey;
    __exports__.pluck = pluck;
  });
define("ember-gdrive/uuid", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function uuid() {
      var n = 10; // max n is 16
      return new Array(n+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, n)
    }
  });
define("ember-gdrive", 
  ["ember-gdrive/store-extensions","ember-gdrive/boot"],
  function(__dependency1__, __dependency2__) {
    "use strict";

    Ember.Application.reopen({
      create: function() {
        Ember.assert('You must implement create() for Ember.Application');
      },
      open: function(id) {
        Ember.assert('You must implement open(id) for Ember.Application');
      }
    });
  });