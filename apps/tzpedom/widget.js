(() => { 
  let timerAct;
  let timerStore;
  let settings;

  function loadSettings() {
    const SETTINGS_FILE = "tzpedom.settings.json";
    settings = require('Storage').readJSON(SETTINGS_FILE, 1) || {};
  }

  function setting(key) {
    const DEFAULTS = {
      'maxTime' : 1000,
      'minTime' : 400,
      'threshold' : 10,
      'actres' : 10000,
      'sens' : 100,
      'goal' : 10000
      //'stride' : 75
    };

    if (!settings) loadSettings();
    return (key in settings) ? settings[key] : DEFAULTS[key];
  }

  function setSens(s) {
    function sqr(x) {return x * x;}
    let X=sqr(8192 - s);
    let Y=sqr(8192 + s);
    Bangle.setOptions({stepCounterThresholdLow: X, stepCounterThresholdHigh: Y});
  }

  let active = 0;
  function resetAct() {
    active = 0;
    steps = 0;
    if (Bangle.isLCDOn()) WIDGETS["tzpedom"].draw();
  }
  
  function draw() {
    let height = 23;

    g.reset();
    g.clearRect(this.x, this.y, this.x + width, this.y + height);

    if (active === 1) g.setColor(0x07E0);
    else g.setColor(0xFFFF);
    g.setFont("6x8", 2);

    g.drawString(stepsCount, this.x+1, this.y);

    settings = 0;
  }

  let lastStep = Date.now();
  let steps = 0;
  let stepsCount = 0;
  Bangle.on('step', (up) => {
    let timeDiff = Date.now() - lastStep;
    let lastStep = Date.now();
    
    if (timeDiff >= setting('maxTime')) return;
    if (timeDiff <= setting('minTime')) return;

    steps++;

    if (steps > setting('threshold')) {
      if (active === 0) {
        stepsCount += setting('threshold');
        active = 1;
      }

      clearInterval(timerAct);
      timerAct = setInterval(resetAct, setting('actres'));
    }

    if (active == 1) stepsCount ++;

    settings = null;
  });

  Bangle.on('lcdPower', function(on) {
    if (on) WIDGETS["tzpedom"].draw();
  });

  timerAct = setInterval(resetAct, setting('actres'));
  settings = null;
  WIDGETS["tzpedom"]={area:"tl",width:width,draw:draw};
})
