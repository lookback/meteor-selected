// Get a collection based on the name of it.
getCollection = function (name) {
  for (var globalObject in window) {
    if (window[globalObject] instanceof Meteor.Collection) {
      if (window[globalObject]._name === name) {
        return (window[globalObject]);
        break;
      };
    }
  }
}

SelectedClass = {
  _stores: {},

  _dep: new Deps.Dependency,

  _getStore: function(name) {
    var store = this._stores[name];
    return store;
  },

  // Creates a store if it doesnt exist.
  _existsOrCreate:function(name) {
    if (!this._stores[name])
      this._createStore(name);
  },

  // Selects the id
  set: function(name, id) {
    this._existsOrCreate(name);

    if (!this.isSelected(name, id)) {
      var store = this._getStore(name);
      store.selectedIds.push(id);
      this._dep.changed();
    }
  },

  // Selects the id and removes any other selection for this store
  setOne: function(name, id) {
    this._existsOrCreate(name);

    if (!_.isEqual(this.getIds(name), [id])) {
      var store = this._getStore(name);
      store.selectedIds = [id];
      this._dep.changed();
    }
  },
  // Deselects an id
  unset: function(name, id) {
    var store = this._getStore(name);

    if (!store) return;

    var newSelection = _.without(store.selectedIds, id);

    if (newSelection.length)
      store.selectedIds = newSelection;
    else
      this._deleteStore(name)

    this._dep.changed();
  },

  inverse: function(name, id) {
    if (this.isSelected(name, id)) {
      this.unset(name, id);
    } else {
      this.set(name, id)
    }
  },

  // Deselects all
  unsetAll: function(name) {
    if (!this._getStore(name)) return;

    this._deleteStore(name)
    this._dep.changed();
  },

  // Reactively gets all selected ids
  getIds: function(name) {
    this._dep.depend();
    var store = this._getStore(name);
    return store ? store.selectedIds : [];
  },

  // Reactively determines if an id is selected
  isSelected: function(name, id) {
    var ids = this.getIds(name);
    return _.contains(ids, id);
  },

  // Reactively get the first selected id in a collection. Useful with setOne.
  getOne: function(name) {
    var ids = this.getIds(name);
    return ids && ids.length ? ids[0] : null;
  },

  // Available config keys and their defaults
  _configKeysAndDefaults: {
    selectedClass: 'selected',
    defaultSelectionQuery: null,
  },

  _getConfigKeys: function() {
    return _.keys(this._configKeysAndDefaults);
  },

  // Gets the config where user config has preference.
  getConfig: function(name) {
    var self = this,
        userConfig = this._configs[name] || {},
        defaults = this._configKeysAndDefaults,
        config = {};

    _.each(self._getConfigKeys(), function(key) {
      config[key] = userConfig[key] || defaults[key]
    });

    return config;
  },

  _configs: {},

  // Sets a config.
  config: function(name, options) {
    var self = this;

    options = options || {};

    if (!this._configs[name])
      this._configs[name] = {};

    var config = this._configs[name];

    _.each(options, function(optionValue, optionKey) {
      if (_.contains(self._getConfigKeys(), optionKey))
        config[optionKey] = optionValue;
    })
  },

  // Creates a store for selected ids of a given collection. Sets up
  // a listener on the collection so that if the document matching the selected id
  // is removed then the id will be removed from the selection.
  _createStore: function(name) {
    var self = this;

    if (this._stores[name])
      throw new Error('Selected: That collection already exists');

    var collection = getCollection(name)

    if (!collection)
      throw new Error('Selected: That collection does not exist in the global scope.');

    var store = {
      collection: collection,

      selectedIds: [],

      handle: collection.find().observeChanges({
        removed: function(id) {
          // If the id is selected remove it from the selection.
          // If its the only one selected and we got a default query, set the document
          // matching the default query as selected.
          if (self.isSelected(name, id)) {
            var query = self.getConfig(name).defaultSelectionQuery;
            if (query && self.getIds(name).length == 1) {
              var defaultId = collection.findOne(query)._id
              self.setOne(name, defaultId);
            } else {
              self.unset(name, id)
            }
          }
        }
      }),
    }

    this._stores[name] = store;
  },

  // Stop the handle and delete the store.
  _deleteStore: function(name) {
    var store = this._getStore(name);

    store.handle.stop();

    delete this._stores[name]
  },

  _create: function() {
    return Object.create(this);
  },
}

Selected = SelectedClass._create();

