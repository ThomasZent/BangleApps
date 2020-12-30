(() => { 
  let timerAct;
  let timerStore;
  let settings;
  let active = 0;
  let lastStep = Date.now();
  let steps = 0;
  let stepsCount = 0;

  function loadSettings() {
    const SETTINGS_FILE = "tzpedom.settings.json";
    settings = require('Storage').readJSON(SETTINGS_FILE, 1) || {};
  }

  function setting(key) {
    const DEFAULTS = {
      'maxTime' : 1000,
      'minTime' : 400,
      'threshold' : 10,
      'actres' : 11000,
      'sens' : 90,
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

  function draw() {
    let height = 23;

    g.reset();
    g.clearRect(this.x, this.y, this.x + width, this.y + height);

    if (active === 1) g.setColor(0x07E0);
    else g.setColor(0xFFFF);
    g.setFont("6x8", 2);
    g.drawString(formatSteps(stepsCount), this.x+1, this.y);


    g.setFont("6x8", 1);
    g.setColor(0xFFFF);
    g.drawString(toKM(stepsCounted) + "km", this.x + 1, this.y + 14);

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

    settings = null;
  });

  Bangle.on('lcdPower', function(on) {
    if (on) WIDGETS["tzpedom"].draw();
  });

  setSens(setting('sens'));
  timerAct = setInterval(resetAct, setting('actres'));
  settings = null;
  WIDGETS["tzpedom"]={area:"tl",width:width,draw:draw};
})();
