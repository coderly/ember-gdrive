(function() {
define("ember-gdrive/adapter", 
  ["./uuid","./document","./change-observer","./util","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var uuid = __dependency1__["default"];
    var Document = __dependency2__["default"];
    var ChangeObserver = __dependency3__["default"];

    var modelKey = __dependency4__.modelKey;

    var Adapter = DS.Adapter.extend(Ember.ActionHandler, {
      defaultSerializer: '-google-drive',

      documentSource: null,
      document: Ember.computed.alias('documentSource.document'),

      unresolvedLocalChanges: 0,

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
        },

        recordCreatedLocally: function(store, typeKey, data) {
          if (this.get('unresolvedLocalChanges') > 0) {
            store.push(typeKey, data);
            this.decrementProperty('unresolvedLocalChanges');
          }
        },
        recordUpdatedLocally: function(store, typeKey, data, e) {
          if (this.get('unresolvedLocalChanges') > 0) {
            store.push(typeKey, data);
            this.decrementProperty('unresolvedLocalChanges');
          }
        },
        recordDeletedLocally: function(store, typeKey, id) {
          if (this.get('unresolvedLocalChanges') > 0) {
            var deletedRecord = store.getById(typeKey, id);
            store.unloadRecord(deletedRecord);
            this.decrementProperty('unresolvedLocalChanges');
          }
        }
      },

      ref: function() {
        return this.get('document').ref();
      }.property('document'),

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

        this.beginSave();
        ref.get(modelKey(type), id).set(serializedRecord);
        this.endSave();

        this.observeRecordData(store, type.typeKey, id);

        return Ember.RSVP.resolve( this.get('ref').get(modelKey(type), id).value() );
      },

      updateRecord: function(store, type, record) {
        var serializedRecord = record.serialize({includeId: true}),
            id = record.get('id'),
            ref = this.get('ref');

        this.beginSave();
        ref.get(modelKey(type), id).set(serializedRecord);
        this.endSave();

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
        this.incrementProperty('unresolvedLocalChanges');
        this.get('document').undo();
      },

      redo: function() {
        this.incrementProperty('unresolvedLocalChanges');
        this.get('document').redo();
      },

      beginSave: function(name) {
        this.get('document').beginSave(name);
      },

      endSave: function() {
        this.get('document').endSave();
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

    var Auth = Ember.StateManager.extend({
      enableLogging: false,
      initialState: 'loggedOut',

      user: null,

      clientID: ENV.GOOGLE_CLIENT_ID,
      userID: Ember.computed.alias('user.id'),
      permissions: [INSTALL_SCOPE, FILE_SCOPE, OPENID_SCOPE],

      token: function() {
        return gapi.auth.getToken().access_token;
      }.property('currentState'),

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

    __exports__["default"] = Auth;
  });
define("ember-gdrive/boot", 
  ["ember-gdrive/auth","ember-gdrive/document-source","ember-gdrive/loader","ember-gdrive/adapter","ember-gdrive/serializer","ember-gdrive/document","ember-gdrive/state"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__) {
    "use strict";
    var GoogleDriveAuth = __dependency1__["default"];
    var DocumentSource = __dependency2__["default"];
    var loader = __dependency3__["default"];

    var GoogleDriveAdapter = __dependency4__["default"];
    var GoogleDriveSerializer = __dependency5__["default"];
    var GoogleDriveDocument = __dependency6__["default"];

    var State = __dependency7__["default"];

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

      Application.initializer({
        name: "googleDriveAuth",
        before: "store",

        initialize: function(container, application) {
          application.register('auth:google', GoogleDriveAuth);

          application.inject('controller', 'auth', 'auth:google');
          application.inject('route', 'auth', 'auth:google');


          // open file if present
          var auth = container.lookup('auth:google');
          var state = State.create();

          if (state.get('isOpen')) {
            application.open(state.get('fileID'));
          }
          else if (state.get('isCreate')) {
            loader.load().then(function() {
              return auth.checkStatus();
            }).then(function(user) {
              var fileOptions = application.create();
              return GoogleDriveDocument.create(fileOptions);
            }).then(function(doc) {
              application.open(doc.get('id'))
            });
          }
        }
      });

    });
  });
define("ember-gdrive/change-observer", 
  ["./util","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var normalizeTypeKey = __dependency1__.normalizeTypeKey;

    __exports__["default"] = Ember.Object.extend(Ember.ActionHandler, {
      ref: null,
      target: null,
      observedMap: function() { return {} }.property(),

      observeRecordData: function(store, typeKey, id) {
        var observer = this,
            observedMap = this.get('observedMap'),
            key = [normalizeTypeKey(typeKey), id].join('/'),
            ref = this.get('ref');

        if (this.contains(key)) {
          return Ember.RSVP.Promise.resolve();
        }
        else {
          observedMap[key] = true; // can set this to the promise and return that every time
        }

        ref.get(normalizeTypeKey(typeKey), id).changed(function(e) {
          if (e.type == 'object_changed')
            Ember.run(function(){
              observer.recordDataChanged(store, typeKey, id, e);
            });
        });
      },

      observeIdentityMap: function(store, typeKey) {
        var observer = this,
            observedMap = this.get('observedMap'),
            key = [normalizeTypeKey(typeKey)].join('/'),
            ref = this.get('ref');

        if (this.contains(key)) {
          return Ember.RSVP.Promise.resolve();
        }
        else {
          observedMap[key] = true;
        }

        ref.get(normalizeTypeKey(typeKey)).materialize().changed(function(e) {
          if (e.type == 'value_changed')
            Ember.run.once(observer, 'identityMapChanged', store, typeKey, e);
        });
      },

      contains: function(key) {
        var observedMap = this.get('observedMap');
        return observedMap[key];
      },

      recordDataChanged: function(store, typeKey, id, e) {
        var ref = this.get('ref');
        if (e.isLocal) {
          var data = ref.get(normalizeTypeKey(typeKey), id).value();
          this.send('recordUpdatedLocally', store, typeKey, data);
        }
        else {
          var data = ref.get(normalizeTypeKey(typeKey), id).value();
          this.send('recordUpdatedRemotely', store, typeKey, data);
        }
      },

      identityMapChanged: function(store, typeKey, e) {
        var ref = this.get('ref');

        if (e.isLocal && e.oldValue == null && e.newValue) {
          this.send('recordCreatedLocally', store, typeKey, e.newValue.get('id'));
        }

        else if (e.isLocal && e.oldValue && e.newValue == null) {
          this.send('recordDeletedLocally', store, typeKey, e.oldValue.get('id'));
        }

        else if (!e.isLocal && e.oldValue == null && e.newValue) {
          var newRecordId = e.newValue.get('id'),
              data = ref.get(normalizeTypeKey(typeKey), newRecordId).value();

          this.send('recordCreatedRemotely', store, typeKey, data);
        }

        else if (!e.isLocal && e.oldValue && e.newValue == null) {
          var deletedRecordId = e.oldValue.get('id');
          this.send('recordDeletedRemotely', store, typeKey, deletedRecordId);
        }
      }

    });
  });
define("ember-gdrive/document-source", 
  ["./document","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Document = __dependency1__["default"];

    var DocumentSource = Ember.Object.extend({
      id: null,
      document: null,

      load: function(documentId) {
        var documentSource = this;

        this.set('id', documentId);

        return Document.find( documentId ).then(function(doc) {
          return documentSource.set('document', doc);
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
      content: null,

      init: function(googleDocument) {
        Ember.assert('You must pass in a valid google document.', !!googleDocument);
        this.set('content', googleDocument);
      },

      ref: function() {
        return new Reference(
          this.get('model'),
          null,
          null,
          this.get('root')
        );
      },

      beginSave: function() {
        this.get('model').beginCompoundOperation();
      },

      endSave: function() {
        this.get('model').endCompoundOperation();
      },

      root: function() {
        return this.get('model').getRoot();
      }.property('model'),

      model: function() {
        return this.get('content').getModel();
      }.property('content'),

      /* undo/redo */

      undo: function() {
        if (this.canUndo()) {
          this.get('model').undo();
        }
      },

      redo: function() {
        if (this.canRedo()) {
          this.get('model').redo();
        }
      },

      canUndo: function() {
        return this.get('model').canUndo;
      },

      canRedo: function() {
        return this.get('model').canRedo;
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
            return new Document(googleDocument);
        }, function(e) {
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
        var _this = this;
        return _this._sendCreateRequest(params).then(function(googleFile) {
          if (googleFile.error) {
            return Ember.RSVP.reject(new Error(googleFile.error.message));
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

    __exports__["default"] = MapReference;
  });
define("ember-gdrive/router-auth", 
  [],
  function() {
    "use strict";
    Ember.Route.reopen({
      requiresAuth: false,
      beforeModel: function() {
        var route = this;
        if (this.get('requiresAuth')) {
          return this.get('auth').checkStatus().then(function(user) {
            return user;
          }, function(error) {
            route.unauthenticated('unauthenticated');
          });
        }
      },

      unauthenticated: function() {
        Ember.assert('You must override unauthenticated for the routes where requiresAuth is set to true');
      }

    });
  });
define("ember-gdrive/serializer", 
  ["./util","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var recordKey = __dependency1__.recordKey;

    var serializeRecordId = function(record) {
      return record.get('id');
    };

    var serializeRecordPolymorphicId = function(record) {
      return {
        id: record.get('id'),
        type: recordKey(record)
      }
    };

    var Serializer = DS.JSONSerializer.extend({

      serializeHasMany: function(record, json, relationship) {
        var key = relationship.key,
          relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

        if (relationshipType === 'manyToNone' || relationshipType === 'manyToMany') {
          var serializeId = relationship.options.polymorphic ? serializeRecordPolymorphicId : serializeRecordId;
          json[key] = Ember.get(record, key).map(serializeId);
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

      fileID: function() {
        return this.get('fileIDs').objectAt(0);
      }.property('fileIDs'),

      isOpen: function() {
        return this.get('action') == 'open';
      }.property('action'),

      isCreate: function() {
        return this.get('action') == 'create';
      }.property('action'),

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
      endSave: function() {
        this._defaultAdapter().endSave();
      },
      _defaultAdapter: function() {
        return this.container.lookup('adapter:application');
      }
    });
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

    __exports__.normalizeTypeKey = normalizeTypeKey;
    __exports__.modelKey = modelKey;
    __exports__.recordKey = recordKey;
  });
define("ember-gdrive/uuid", 
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
define("ember-gdrive", 
  ["ember-gdrive/router-auth","ember-gdrive/store-extensions","ember-gdrive/boot"],
  function(__dependency1__, __dependency2__, __dependency3__) {
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
}());