var pal, img1, img2, img1height, img2height, cycle;

function loadImg(img) {
  var Storage = require("Storage");
  pal = new Uint16Array(E.toArrayBuffer(E.toString(Storage.read("animclk_" + img + ".pal"))));
  img1 = Storage.read("animclk_" + img + ".pixels1");
  img2 = Storage.read("animclk_" + img + ".pixels2");
  img1height = img1.length/240;
  img2height = img2.length/240;
  cycle = Storage.readJSON("animclk_" + img + ".cycles",1).cycle;
}

var hours = Date.now.getHours();
loadImg((hours > 7 && hours < 19) ? "am" : "pm");

var is12Hour = require("Storage").readJSON("setting.json",1)["12hour"];
var IX = 80, IY = 10, IBPP = 1;
var IW = 174, IH = 45, OY = 24;
var inf = {align:0};
var secondInterval;

require("Font7x11Numeric7Seg").add(Graphics);
var cg = Graphics.createArrayBuffer(IW,IH,IBPP,{msb:true});
var cgimg = {width:IW,height:IH,bpp:IBPP,transparent:0,buffer:cg.buffer};
var locale = require("locale");
var lastTime = "";

function drawClock() {
  var t = new Date();
  var hours = t.getHours();
  var meridian = "";
  if (is12Hour) {
    meridian = (hours < 12) ? "AM" : "PM";
    hours = ((hours + 11) % 12) + 1;
  }
  // draw time
  cg.clear(1);
  cg.setColor(1);
  var x = 74 + 32 * inf.align;
  cg.setFont("7x11Numeric7Seg",3);
  cg.setFontAlign(1,-1);
  cg.drawString(hours, x, 0);
  x+=2;
  if (t.getSeconds() & 1)
    cg.fillRect(x, 10, x+2, 10+2).fillRect(x, 20, x+2, 20+2);
  x+=6;
  cg.setFontAlign(-1,-1);
  cg.drawString(("0"+t.getMinutes()).substr(-2), x, 0);
  x+=44;
  cg.setFont("7x11Numeric7Seg",1);
  cg.drawString(("0"+t.getSeconds()).substr(-2), x, 20);
  cg.setFont("6x8",1);
  cg.drawString(meridian, x+2, 0);
  let date = locale.date(t);
  if (cg.stringWidth(date) < IW-64) {
    cg.setFontAlign(0, -1);
    cg.drawString(date,IW/2+32*inf.align,IH-8);
  } else {
    cg.setFontAlign(inf.align, -1);
    cg.drawString(date,IW*(inf.align+1)/2,IH-8);
  }
}

function draw() {
  var t = (new Date()).toString();
  if (t!=lastTime) {
    lastTime = t;
    drawClock();
  }
  // color cycling
  cycle.forEach(c=>{
    var p = pal.slice(c.low,c.high);
    pal[c.low] = pal[c.high];
    pal.set(p,c.low+1);
  });
  // draw image
  g.setColor(-1);
  // draw just the clock part overlaid (to avoid flicker)
  g.drawImages([{x:0,y:OY,image:{width:240,height:img1height,bpp:8,palette:pal,buffer:img1}},
    {image:cgimg,x:IX,y:IY+OY}],
  {x:0,y:OY,width:239,height:img1height});
  // now draw the image on its own below - this is faster
  g.drawImage({width:240,height:img2height,bpp:8,palette:pal,buffer:img2},0,OY+img1height);
}

function startDraw() {
  g.clear();
  g.reset();
  draw();
  secondInterval = setInterval(draw,100);
  Bangle.loadWidgets();
  Bangle.drawWidgets();
}

function stopDraw() {
  clearInterval(secondInterval);
  secondInterval = undefined;
}

var SCREENACCESS = {
  withApp: true,
  request: function() {
    this.withApp = false;
    stopDraw();
    clearWatch();
  },
  release: function() {
    this.withApp = true;
    setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: "falling" });
    lastTime = "";
    startDraw();
  }
};

startDraw();

// Stop when LCD goes off
Bangle.on('lcdPower',on=>{
  if (!SCREENACCESS.withApp) return;
  if (secondInterval) clearInterval(secondInterval);
  secondInterval = undefined;
  if (on) {
    var hours = Date.now().getHours();
    loadImg((hours > 7 && hours < 19) ? "am" : "pm");
    secondInterval = setInterval(draw,100);
    lastTime="";
    draw();
  }
});

// Show launcher when middle button pressed
setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: "falling" });