UI.registerHelper('isSelected', function(name, id) {
  return Selected.isSelected(name, id)
});

UI.registerHelper('selectedClass', function(name, id) {
  return Selected.isSelected(name, id) ? 'selected' : '';
})
