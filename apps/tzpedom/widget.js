(() => { 
  let timerAct;
  let timerStore;
  let lastWrite;
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
      'maxTime' : 1100,
      'minTime' : 400,
      'threshold' : 15,
      'actres' : 20000,
      'sens' : 100,
      'goal' : 10000,
      'length' : 126,
      'buzz' : 0
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
      let dec = steps / 1000;

      if (count % 1000 < 100) return dec.toString.substring(0,1) + "k";
      else return dec.toString().substring(0,3) + "k";
    }

    return Math.floor(steps / 1000) + "k";
  }

  function toKM(steps) {
    return steps * setting('length') / 100000;
  }

  function store() {
    let now = new Date();
    const FILENAME = "tzpedom" + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + ".steps.json";
    
    let data = {
      steps: stepsCount
    }

    if (lastWrite && now.getDate() !== lastWrite) {
      require("Storage").write("tzpedom" + now.getFullYear() + (now.getMonth() + 1) + lastWrite + "steps.json", data);
      stepsCount = 0;
    } else {
      require("Storage").write("tzpedom" + now.getFullYear() + (now.getMonth() + 1) + now.getDate() + "steps.json", data);
    }

    lastWrite = now.getDate();
  }

  function read() {
    let now = new Date();
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
    g.setColor(0x7BEF);
    g.fillRect(this.x, this.y + height, this.x + width, this.y + height);
    g.setColor(0xFFFF);
    g.fillRect(this.x, this.y + height, this.x + 1, this.y + height - 1);
    g.fillRect(this.x + width, this.y + height, this.x + width - 1, this.y + height - 1);
    if (length >= width) {
      length = width;
      g.setColor(0x07E0);
    }
    g.fillRect(this.x, this.y + height, this.x + length, this.y + height);

    settings = null;
  }

  E.on('kill', store);
  
  Bangle.on('step', (up) => {
    let timeDiff = Date.now() - lastStep;
    lastStep = Date.now();
    
    if (timeDiff > setting('maxTime')) return;
    if (timeDiff < setting('minTime')) return;

    if (setting('buzz')) Bangle.buzz();
    steps++;

    if (steps > setting('threshold')) {
      if (active === 0) {
        stepsCount += setting('threshold');
        active = 1;
      }

      clearInterval(timerAct);
      timerAct = setInterval(resetAct, setting('actres'));
    }

    if (active === 1) stepsCount ++;

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
