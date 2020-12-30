(() => { 
  let timerAct;
  let timerStore;
  let settings;
  let active = 0;
  let lastStep = Date.now();
  let steps = 0;
  let stepsCount = 0;
  let width = 46;

  function loadSettings() {
    const SETTINGS_FILE = "tzpedom.settings.json";
    settings = require('Storage').readJSON(SETTINGS_FILE, 1) || {};
  }

  function setting(key) {
    const DEFAULTS = {
      'maxTime' : 1000,
      'minTime' : 500,
      'threshold' : 13,
      'actres' : 15000,
      'sens' : 130,
      'goal' : 10000,
      'stride' : 126
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

  function resetAct() {
    active = 0;
    steps = 0;
    if (Bangle.isLCDOn()) WIDGETS["tzpedom"].draw();
  }
  
  function formatStep(steps) {
    if (steps < 1000) {
      return steps;
    }
    
    if (steps < 10000) {
      return Math.trunc(steps / 1000) + "." + Math.toString(steps % 1000).substring(0,1) + "k";
    }

    return Math.floor(steps / 1000) + "k";
  }

  function toKM(steps) {
    return steps * setting('stride') / 100000;
  }

  function store() {
    let now = Date.now();
    const FILENAME = "tzpedom" + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + ".steps.json";
    
    let data = {
      steps: stepsCount
    }

    require("Storage").write(FILENAME, data);
  }

  function read() {
    let now = Date.now();
    const FILENAME = "tzpedom" + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + ".steps.json";
    
    let data = require("Storage").readJSON(FILENAME, 1);

    if (data) stepsCount = data.steps;
  }

  function draw() {
    let height = 23;

    g.reset();
    g.clearRect(this.x, this.y, this.x + width, this.y + height);

    if (active === 1) g.setColor(0x07E0);
    else g.setColor(0xFFFF);
    g.setFont("6x8", 2);
    g.drawString(formatStep(stepsCount), this.x+1, this.y);

    g.setFont("6x8", 1);
    g.setColor(0xFFFF);
    g.drawString(toKM(stepsCount).toFixed(3) + "km", this.x + 1, this.y + 14);

    length = (stepsCount / setting('goal')) * width;
    if (length > width) length = width;
    g.setColor(0x7BEF);
    g.fillRect(this.x, this.y + height, this.x + width, this.y + height);
    g.setColor(0xFFFF);
    g.fillRect(this.x, this.y + height, this.x + 1, this.y + height - 1);
    g.fillRect(this.x + width, this.y + height, this.x + width - 1, this.y + height - 1);
    g.fillRect(this.x, this.y + height, this.x + length, this.y + height);

    settings = null;
  }

  E.on('kill', store);
  
  Bangle.on('step', (up) => {
    let timeDiff = Date.now() - lastStep;
    lastStep = Date.now();
    
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

    if (Bangle.isLCDOn()) WIDGETS["tzpedom"].draw();

    settings = null;
  });

  Bangle.on('lcdPower', function(on) {
    if (on) WIDGETS["tzpedom"].draw();
  });

  setSens(setting('sens'));

  read(); 

  timerAct = setInterval(resetAct, setting('actres'));
  timerStore = setInterval(store, 300000);

  settings = null;
  WIDGETS["tzpedom"]={area:"tl",width:width,draw:draw};
})();
