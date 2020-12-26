(function (back) {
  const Storage = require("Storage");
  const filename = 'multiclock.json';
  let settings = Storage.readJSON(filename,1) || null;

  function resetSettings() {
    return {
      iface: 0
    };
  }

  function updateSettings() {
    Storage.writeJSON(filename, settings);
  }

  if (!settings) {
    settings = resetSettings();
    updateSettings();
  }

  function saveChange(name) {
    return function(v) {
      settings[name] = v;
      updateSettings();
    }
  }

  E.showMenu({
    '': { 'title': 'Multiclock Settings' },
    "Start Face" : {
      value : settings.iface,
      min: 0, max: Storage.list(/\.face\.js$/).length - 1, step: 1,
      onchange : saveChange('iface')
    },
    '< Back' : back
  });
});
