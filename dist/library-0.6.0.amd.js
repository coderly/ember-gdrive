define("library/adapter", 
  ["./uuid","./document","./change-observer","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var uuid = __dependency1__["default"];
    var Document = __dependency2__["default"];
    var ChangeObserver = __dependency3__["default"];

    __exports__["default"] = DS.Adapter.extend(Ember.ActionHandler, {

      documentSource: null,
      documentId: Ember.computed.alias('documentSource.id'),

      defaultSerializer: '-google-drive',

      document: function() {
        Ember.assert('A document id was not assigned. Make sure you set a document ' +
                     'id in a route before the store is accessed', this.get('documentId'));

        return Document.find( this.get('documentId') );

      }.property('documentId'),

      _actions: {
        recordCreatedRemotely: function(store, typeKey, data) {
          store.push(typeKey, data);
        },
        recordUpdatedRemotely: function(store, typeKey, data) {
          store.push(typeKey, data);
        },
        recordDeletedRemotely: function(store, typeKey, id) {
          var deletedRecord = store.getById(typeKey, id);
          store.unloadRecord(deletedRecord);
        }
      },

      ref: function() {
        return this.get('document').then(function(document) {
          document.ref().then(function(r) { window.ref = r; });
          return document.ref();
        });
      },

      changeObserver: function() {
        return ChangeObserver.create({ ref: this.ref(), target: this });
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
        var adapter = this;
        return this.ref().then(function(ref) {
          adapter.observeRecordData(store, type.typeKey, id);
          return ref.get(type.typeKey, id).value();
        });
      },

      createRecord: function(store, type, record) {
        var adapter = this;

        return this.ref().then(function(ref) {
          var serializedRecord = record.serialize({includeId: true}),
              id = record.get('id');

          ref.begin();
          ref.get(type.typeKey, id).set(serializedRecord);
          ref.end();

          adapter.observeRecordData(store, type.typeKey, id);

          return ref.get(type.typeKey, id).value();
        });
      },

      updateRecord: function(store, type, record) {
        var adapter = this;
        return this.ref().then(function(ref) {
          var serializedRecord = record.serialize({includeId: true}),
              id = record.get('id');

          ref.begin();
          ref.get(type.typeKey, id).set(serializedRecord);
          ref.end();

          adapter.observeRecordData(store, type.typeKey, id);

          return ref.get(type.typeKey, id).value();
        });
      },

      findAll: function(store, type) {
        var adapter = this;

        return this.ref().then(function(ref) {
          var identityMap = ref.get(type.typeKey).value() || {};
          var keys = ref.get(type.typeKey).keys();
          var serializedRecords = [];

          for (var i = 0; i < keys.length; i++) {
            serializedRecords.push( identityMap[ keys[i] ] );
          }

          adapter.observeIdentityMap(store, type.typeKey);

          serializedRecords.forEach(function(data) {
            adapter.observeRecordData(store, type.typeKey, data.id);
          });

          return serializedRecords;
        });
      },

      deleteRecord: function(store, type, record) {
        return this.ref().then(function(ref) {
          var id = record.get('id');
          ref.get(type.typeKey).delete(id);
        });
      }

    });
  });
define("library/auth", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install',
        FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file',
        OPENID_SCOPE = 'openid';

    __exports__["default"] = Ember.StateManager.extend({
      enableLogging: false,
      initialState: 'loggedOut',

      user: null,

      // isLoggedIn is deprecated but used elsewhere
      isLoggedIn: Ember.computed.alias('isAuthenticated'),

      clientID: ENV.GOOGLE_CLIENT_ID,
      userID: Ember.computed.alias('user.id'),
      permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

      token: function() {
        return gapi.auth.getToken().access_token;
      }.property('currentState'),

      whenLoggedIn: function(handler) {
        if (this.get('isLoggedIn')) {
          handler();
        }
        else {
          this.one('loggedin', function() {
            handler();
          });
        }
      },

      checkStatus: function() {
        if (this.get('isAuthenticated')) {
          return Ember.RSVP.resolve(this.get('user'));
        }

        var auth = this;
        auth.transitionTo('checking');
        return auth._fetchLoginState().then(function() {
          auth.transitionTo('loggingIn.fetchingUser');
          return auth._fetchUserObject();
        }, function(error){
          auth.transitionTo('loggedOut.known');
          return Ember.RSVP.reject(error);
        }, "checkStatus _fetchLoginState handler").then(function(user) {
          auth.transitionTo('loggedIn');
          auth.set('user', user);
          return user;
        }, null, "checkState _fetchUserObject handler");
      },

      login: function() {
        this.transitionTo('loggingIn.showingPrompt');
      },

      _fetchLoginState: function() {
        var auth = this;

        return new Ember.RSVP.Promise(function(resolve, reject) {
          gapi.auth.authorize({
            client_id: auth.get('clientID'),
            user_id: auth.get('userID'),
            scope: auth.get('permissions'),
            immediate: true
          }, function(result){
            if (result && !result.error) {
              Ember.run(null, resolve);
            } else {
              Ember.run(null, reject, result && result.error ? result.error : 'unauthenticated');
            }
          })
        }, 'GoogleDriveAuth _fetchLoginState');
      },

      _fetchUserObject: function(handler) {
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

      states: {
        loggedOut: Ember.State.create({
          initialState: 'unknown',
          unknown: Ember.State.create(),

          enter: function() {
            this.set('isUnauthenticated', true);
          },
          exit: function() {
            this.set('isUnauthenticated', false);
          },

          checking: Ember.State.create(),
          known: Ember.State.create(),
          loginFailed: Ember.State.create()
        }),

        loggedIn: Ember.State.create({
          enter: function(stateManager) {
            stateManager.trigger('loggedin');
            stateManager.set('isAuthenticated', true);
          },
          exit: function(stateManager) {
            stateManager.trigger('loggedout');
            stateManager.set('isAuthenticated', false);
          }
        }),

        loggingIn: Ember.State.create({

          fetchingUser: Ember.State.create(),

          showingPrompt: Ember.State.create({
            enter: function(stateManager) {
              var handler = function(result) {
                if (result && !result.error) {
                  stateManager.transitionTo('fetchingUser');
                }
                else {
                  stateManager.transitionTo('loggedOut.loginFailed');
                }
              };
              gapi.auth.authorize({
                client_id: stateManager.get('clientID'),
                user_id: stateManager.get('userID'),
                scope: stateManager.get('permissions'),
                immediate: false
              }, handler);
            }
          })
        })
      }
    });
  });
define("library/change-observer", 
  ["exports"],
  function(__exports__) {
    "use strict";
    window.vals = [];

    __exports__["default"] = Ember.Object.extend(Ember.ActionHandler, {
      ref: null,
      target: null,
      observedMap: function() { return {} }.property(),

      observeRecordData: function(store, typeKey, id) {
        var observer = this,
            observedMap = this.get('observedMap'),
            key = [typeKey, id].join('/');

        if (this.contains(key)) {
          return Ember.RSVP.Promise.resolve();
        }
        else {
          observedMap[key] = true;
        }

        return this.get('ref').then(function(ref) {
          ref.get(typeKey, id).changed(function(e) {
            if (e.type == 'object_changed')
              Ember.run.once(observer, 'recordDataChanged', store, typeKey, id, e);
          });
        });
      },

      observeIdentityMap: function(store, typeKey) {
        var observer = this,
          observedMap = this.get('observedMap'),
          key = [typeKey].join('/');

        if (this.contains(key)) {
          return Ember.RSVP.Promise.resolve();
        }
        else {
          observedMap[key] = true;
        }

        return this.get('ref').then(function(ref) {
          ref.get(typeKey).materialize().changed(function(e) {
            if (!e.isLocal) {
              window.vals.push(e);
            }

            if (e.type == 'value_changed')
              Ember.run.once(observer, 'identityMapChanged', store, typeKey, e);
          });
        });

      },

      contains: function(key) {
        var observedMap = this.get('observedMap');
        return observedMap[key];
      },

      recordDataChanged: function(store, typeKey, id, e) {
        if (e.isLocal) {
          this.send('recordUpdatedLocally', store, typeKey, id);
        }
        else {
          var observer = this;
          this.get('ref').then(function(ref) {
            var data = ref.get(typeKey, id).value();
            observer.send('recordUpdatedRemotely', store, typeKey, data);
          });
        }
      },

      identityMapChanged: function(store, typeKey, e) {
        var observer = this;

        if (e.isLocal && e.oldValue == null && e.newValue) {
          this.send('recordCreatedLocally', store ,typeKey, e.newValue.get('id'));
        }
        else if (e.isLocal && e.oldValue && e.newValue == null) {
          this.send('recordDeletedLocally', store, typeKey, e.oldValue.get('id'));
        }
        else if (!e.isLocal && e.oldValue == null && e.newValue) {
          var newRecordId = e.newValue.get('id');
          this.get('ref').then(function(ref) {
            var data = ref.get(typeKey, newRecordId).value();
            observer.send('recordCreatedRemotely', store, typeKey, data);
          });
        }
        else if (!e.isLocal && e.oldValue && e.newValue == null) {
          var deletedRecordId = e.oldValue.get('id');
          this.send('recordDeletedRemotely', store, typeKey, deletedRecordId);
        }
      }

    });
  });
define("library/document-source", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.Object.extend({
      id: null
    });
  });
define("library/document", 
  ["appkit/lib/google-drive/reference","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Reference = __dependency1__["default"];

    var Document = Ember.Object.extend(Ember.Evented, {
      id: Ember.computed.alias('file.id'),
      title: Ember.computed.alias('file.title'),
      isEditable: Ember.computed.alias('file.editable'),

      file: null,
      doc: null,

      isLoaded: false,
      loadPromise: null,

      init: function(file) {
        Ember.assert('You must pass in a valid google file.', !!file);

        this.set('file', file);
        this.get('collaborators', Ember.A());

        this.load();
      },

      load: function() {
        if (this.get('loadPromise'))
          return this.get('loadPromise');

        var document = this;

        var onLoad = function() {
          document.onLoad.apply(document, arguments);
          document.set('isLoaded', true);
        };

        var onError = function() {
          document.onError.apply(document, arguments);
        };

        var loadPromise = new Ember.RSVP.Promise(function(resolve, reject){
          gapi.drive.realtime.load(document.get('id'),
            function(d){ Ember.run(null, resolve, d); },
            Ember.K,
            function(e){ Ember.run(null, reject, e); }
          );
        }).then(onLoad, onError).then(function(){ return document; });

        this.set('loadPromise', loadPromise);

        return loadPromise;
      },

      ref: function() {
        return this.load().then(function(document) {
          return new Reference(
            document.get('model'),
            null,
            null,
            document.get('root')
          );
        });
      },

      begin: function() {
        this.get('model').beginCompoundOperation();
      },

      end: function() {
        this.get('model').endCompoundOperation();
      },

      root: function() {
        return this.get('model').getRoot();
      }.property('model'),

      model: function() {
        return this.get('doc').getModel();
      }.property('doc'),

      onLoad: function(doc) {
        this.set('doc', doc);
        this.trigger('loaded');

        this.refreshCollaborators();
        this.setupCollaboratorEventListeners();
      },

      onError: function(e) {
        if(e.type == gapi.drive.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
          this.authorizeWithGoogle();
        } else if(e.type == gapi.drive.realtime.ErrorType.CLIENT_ERROR) {
          alert("An Error happened: " + e.message);
        } else if(e.type == gapi.drive.realtime.ErrorType.NOT_FOUND) {
          alert("The file was not found. It does not exist or you do not have read access to the file.");
        }
      },

      /* undo/redo */

      unresolvedLocalChanges: 0,

      undo: function() {
        if (this.canUndo()) {
          this.incrementProperty('unresolvedLocalChanges');
          this.get('model').undo();
        }
      },

      redo: function() {
        if (this.canRedo()) {
          this.incrementProperty('unresolvedLocalChanges');
          this.get('model').redo();
        }
      },

      canUndo: function() {
        return this.get('model').canUndo;
      },

      canRedo: function() {
        return this.get('model').canRedo;
      },

      /* collaborator code */
      collaborators: [],

      refreshCollaborators: function() {
        var collaboratorRecords = this.get('doc').getCollaborators();
        this.set('collaborators', collaboratorRecords);
      },

      setupCollaboratorEventListeners: function() {
        var doc = this.get('doc');
        var _this = this;

        doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, function() {
          _this.refreshCollaborators();
        });

        doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, function() {
          _this.refreshCollaborators();
        });
      }
    });

     var filePromises = {};

    Document.reopenClass({
      find: function(fileID) {
        var _this = this;

        if (filePromises[fileID])
          return filePromises[fileID];

        filePromises[fileID] = new Ember.RSVP.Promise(function(resolve, reject) {
          gapi.client.drive.files.get({fileId: fileID}).execute(function(googleFile) {
            if (googleFile.error) {
              reject(googleFile);
            }
            else {
              resolve( new Document(googleFile) );
            }
          });
        });

        return filePromises[fileID];
      },
      create: function(params) {
        var _this = this;
        return _this._sendCreateRequest(params).then(function(googleFile) {
          if (googleFile.error) {
            return Ember.RSVP.reject(googleFile);
          }
          else {
            return new Document(googleFile);
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
define("library/file-picker", 
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
define("library/loader", 
  ["exports"],
  function(__exports__) {
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

    __exports__["default"] = loader;
  });
define("library/reference", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var assert = function(message, condition) {
      if (!condition)
        throw new Error("Assertion failed: " + message);
    };

    var isPlainObject = function(o) {
      return Object(o) === o && Object.getPrototypeOf(o) === Object.prototype;
    };

    var isArray = function(o) {
      return o instanceof Array;
    };

    var get = function() {
      if (isArray(arguments[0]))
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
        this.data.set(arguments[0], this._coerce(arguments[1]));
      }
      else if (isPlainObject(value)) {
        this.data.clear();
        var keys = Object.keys(value);
        for (var i = 0; i < keys.length; i++) {
          this.data.set( keys[i], value[keys[i]] );
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

    MapReference.prototype.begin = function() {
      return this.model.beginCompoundOperation();
    };

    MapReference.prototype.end = function() {
      return this.model.endCompoundOperation();
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
      assert('You must materialize a NullReference before adding a listener');
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


    window.Reference = MapReference;
    __exports__["default"] = MapReference;
  });
define("library/serializer", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var get = Ember.get;

    var serializeRecordId = function(record) {
      return record.get('id');
    };

    var serializeRecordPolymorphicId = function(record) {
      return {
        id: record.get('id'),
        type: record.constructor.typeKey
      }
    };

    __exports__["default"] = DS.JSONSerializer.extend({

      serializeHasMany: function(record, json, relationship) {
        var key = relationship.key,
          relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

        if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
          var serializeId = relationship.options.polymorphic ? serializeRecordPolymorphicId : serializeRecordId;
          json[key] = get(record, key).map(serializeId);
        }
      }

    });
  });
define("library/share-dialog", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.Object.extend({
      appID: ENV.GOOGLE_DRIVE_SDK_APP_ID,
      fileID: Ember.required(),
      show: function() {
        var appID = this.get('appID'),
            fileID = this.get('fileID'),
            shareClient = new gapi.drive.share.ShareClient(appID);

        shareClient.setItemIds([fileID]);
        shareClient.showSettingsDialog();
      }
    });
  });
define("library/state", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var queryParams = function() {
      var params = {};
      location.search.substr(1).split("&").forEach(function(item) {
        params[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
      });
      return params;
    };

    __exports__["default"] = Ember.Object.extend({

      application: Ember.required(),

      redirectToFileIfProvided: function() {
        if (this.fileProvided()) {
          this.redirectToFile(this.get('fileID'));
        }
      },

      redirectToFile: function(fileID) {
        window.location = this.redirectToFilePath(fileID);
      },

      redirectToFilePath: function(fileID) {
        return window.location.pathname + '#/project/' + fileID;
      },

      fileID: function() {
        return this.get('fileIDs').objectAt(0);
      }.property('fileIDs'),

      fileProvided: function() {
        return this.get('action') == 'open' && this.get('fileIDs');
      },

      queryParams: function() {
        return queryParams();
      }.property(),

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
      folderID: Ember.computed.alias('state.folderId')
    });
  });
define("library/uuid", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var PUSH_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
    var NUM_PUSH_CHARS = PUSH_CHARS.length;
    var lastPushTime = 0;
    var lastRandChars = [];

    __exports__["default"] = function() {
      var now = new Date();
      var duplicateTime = now === lastPushTime;
      lastPushTime = now;
      var timeStampChars = new Array(8);

      for(var i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % NUM_PUSH_CHARS);
        now = Math.floor(now / NUM_PUSH_CHARS);
      }
      var id = timeStampChars.join("");
      
      if(!duplicateTime) {
        for(i = 0; i < 12; i++) {
          lastRandChars[i] = Math.floor(Math.random() * NUM_PUSH_CHARS);
        }
      } else {
        for(i = 11; i >= 0 && lastRandChars[i] === NUM_PUSH_CHARS - 1; i--) {
          lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
      }
      for(i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
      }
      return id;
    }
  });
define("library", 
  ["./my_library/adapter","./my_library/auth","./my_library/docyment","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Adapter = __dependency1__["default"];
    var Auth = __dependency2__["default"];
    var Document = __dependency3__["default"];

    var GDrive = {
      Adapter: Adapter,
      Auth: Auth,
      Document: Document
    };

    __exports__.GDrive = GDrive;
  });