Package.describe({
  summary: '',
})

Package.on_use(function(api) {
  api.use('reactive-dict', 'client');
  api.use('deps', 'client');
  api.use('underscore', 'client');
  api.use('ui', 'client');

  api.add_files('selected.js', 'client')
  api.add_files('ui-helpers.js', 'client')

  api.export('Selected', 'client');
});
