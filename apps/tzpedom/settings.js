(function(back) {
  const SETTINGS_FILE = "tzpedom.settings.json";

  let s = {
    'maxTime' : 1100,
    'minTime' : 400,
    'threshold' : 15,
    'actres' : 20000,
    'sens' : 100,
    'goal' : 10000,
    'length' : 63,
    'buzz' : 0
  }

  const storage = require("Storage");
  const saved = storage.readJSON(SETTINGS_FILE, 1) || {};

  for (const key in saved) {
    s[key] = saved[key];
  }

  function save(key) {
    return function(val) {
      s[key] = value;
      storage.write(SETTINGS_FILE, s);
    }
  }

  const menu = {
    '': { 'title' : 'TZ Pedometer' },
    'Max time (ms)': {
      value: s.maxTime,
      min: 0,
      max: 10000,
      step: 100,
      onchange: save('maxTime')
    },
    'Min time (ms)': {
      value: s.minTime,
      min: 0,
      max: 600,
      step: 10,
      onchange: save('minTime')
    },
    'Step threshold': {
      value: s.threshold,
      min: 0,
      max: 100,
      step: 1,
      onchange: save('threshold')
    },
    'Act.Res. (ms)': {
      value: s.actres,
      min: 1000,
      max: 100000,
      step: 1000,
      onchange: save('actres')
    },
    'Step sens.': {
      value: s.sens,
      min: 0,
      max: 1000,
      step: 10,
      onchange: save('sens')
    },
    'Step goal': {
      value: s.goal,
      min: 500,
      max: 100000,
      step: 100,
      onchange: save('goal')
    },
    'Step length (cm)': {
      value: s.length,
      min: 1,
      max: 150,
      step: 1,
      onchange: save('length')
    },
    'Buzz': {
      value: s.buzz,
      min: 0,
      max: 2,
      step: 1,
      onchange: save('buzz')
    },
    '< Back': back 
    };
    
    E.showMenu(menu);
});
