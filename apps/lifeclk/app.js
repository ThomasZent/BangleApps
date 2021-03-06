Bangle.setLCDTimeout(30);

const is12Hour = (require("Storage").readJSON("setting.json",1)||{})["12hour"];

const squaresize = 5;
const padding = 2;
const bigSquareSize = squaresize+padding;
const noOfSquX = 27;
const noOfSquY = 23;
const screenWidth = noOfSquX * bigSquareSize - padding;
const screenHeight = noOfSquY * bigSquareSize - padding;
const ulCornerX = parseInt((220-screenWidth)/2);
const ulCornerY = parseInt(40 + (160-screenHeight)/2);
const textWidth = 27;
const textHeight = 7;
const sectextWidth = 9;
const textWidthScreen = textWidth*bigSquareSize;
const textHeightScreen = textHeight*bigSquareSize;
const textWidthScreenMin = (textWidth-sectextWidth)*bigSquareSize;
const textWidthScreenSec = sectextWidth*bigSquareSize;
const ulCornerTextX = parseInt((noOfSquX-textWidth)/2);
const ulCornerTextY = parseInt((noOfSquY-textHeight)/2);
const ulCornerTextXScreen = ulCornerX+parseInt((noOfSquX-textWidth)
                                         *bigSquareSize/2);
const ulCornerTextYScreen = ulCornerY+parseInt((noOfSquY-textHeight)
                                         *bigSquareSize/2);
const seculCornerTextX = ulCornerTextX+textWidth-sectextWidth;

let buf = Graphics.createArrayBuffer(screenWidth,screenHeight,1,{msb:true});
let textbufMin = Graphics.createArrayBuffer((textWidth-sectextWidth)*bigSquareSize,
                                         textHeight*bigSquareSize,
                                         1,{msb:true});
let textPreBufMin = Graphics.createArrayBuffer(textWidth-sectextWidth,
                                            textHeight,
                                            8,{msb:true});
let textbufSec = Graphics.createArrayBuffer(sectextWidth*bigSquareSize,
                                         textHeight*bigSquareSize,
                                         1,{msb:true});
let textPreBufSec = Graphics.createArrayBuffer(sectextWidth,
                                            textHeight,
                                            8,{msb:true});

let genNow = new Uint8Array((noOfSquX+2)*(noOfSquY+2));
let genFut = new Uint8Array((noOfSquX+2)*(noOfSquY+2));
let generation=0;
const minuteGens = 10;
let genEnd = minuteGens;
let lastupdatetime=null;

function fillLinesFirstFewGens(){
  let fade = (genEnd-generation)/minuteGens;
  g.setColor(fade,fade,fade);
  // vertical lines
  g.fillRect(ulCornerTextXScreen,
             ulCornerTextYScreen,
             ulCornerTextXScreen,
             ulCornerTextYScreen+textHeightScreen-padding);
  // horizontal lines
  g.fillRect(ulCornerTextXScreen,
             ulCornerTextYScreen,
             ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen);
  g.fillRect(ulCornerTextXScreen,
             ulCornerTextYScreen+textHeightScreen-padding,
             ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen+textHeightScreen-padding);
  g.setColor(1,1,1);
}

function clearLinesFirstFewGens(){
  // vertical lines
  g.clearRect(ulCornerTextXScreen,
             ulCornerTextYScreen,
             ulCornerTextXScreen,
             ulCornerTextYScreen+textHeightScreen-padding);
  // horizontal lines
  g.clearRect(ulCornerTextXScreen,
             ulCornerTextYScreen,
             ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen);
  g.clearRect(ulCornerTextXScreen,
             ulCornerTextYScreen+textHeightScreen-padding,
             ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen+textHeightScreen-padding);
}

function fillLinesLaterGens(){
  g.setColor(1,1,1);
  // horizontal lines
  g.fillRect(ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen,
             ulCornerTextXScreen+textWidthScreenMin+textWidthScreenSec,
             ulCornerTextYScreen);
  g.fillRect(ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen+textHeightScreen-padding,
             ulCornerTextXScreen+textWidthScreenMin+textWidthScreenSec,
             ulCornerTextYScreen+textHeightScreen-padding);
  // vertical lines
  g.fillRect(ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen,
             ulCornerTextXScreen+textWidthScreenMin,
             ulCornerTextYScreen+textHeightScreen-padding);
  g.fillRect(ulCornerTextXScreen+textWidthScreenMin+textWidthScreenSec,
             ulCornerTextYScreen,
             ulCornerTextXScreen+textWidthScreenMin+textWidthScreenSec,
             ulCornerTextYScreen+textHeightScreen-padding);
}

function renderSecText(){
  g.clearRect(ulCornerTextXScreen+18*bigSquareSize+padding,
             ulCornerTextYScreen,
             ulCornerTextXScreen+textWidthScreen,
             ulCornerTextYScreen+textHeightScreen-1);
  fillLinesLaterGens();
  g.drawImage({width:textWidthScreenSec,
               height:textHeightScreen,
               bpp:1,transparent:0,buffer:textbufSec.buffer},
               ulCornerTextXScreen+textWidthScreenMin,ulCornerTextYScreen);
}

function flip(dontclear) {
  g.setColor(1,1,1);
  g.drawImage({width:screenWidth,height:screenHeight,bpp:1,buffer:buf.buffer},
             ulCornerX,ulCornerY);
  if(generation<genEnd){
    g.clearRect(ulCornerTextXScreen,
                ulCornerTextYScreen,
                ulCornerTextXScreen+textWidthScreenMin,
                ulCornerTextYScreen+textHeightScreen);
    g.drawImage({width:textWidthScreenMin,
                 height:textHeightScreen,
                 bpp:1,buffer:textbufMin.buffer},
                 ulCornerTextXScreen,ulCornerTextYScreen);
    renderSecText();
    fillLinesFirstFewGens();
  }
  else{
    renderSecText();
  }
  if(!dontclear){buf.clear();}
}

function skipCell(x,y){
  return (x>=seculCornerTextX && x<seculCornerTextX+sectextWidth
        && y>=ulCornerTextY && y<ulCornerTextY+textHeight)
      || (generation<genEnd
        && x>=ulCornerTextX && x<ulCornerTextX+textWidth
        && y>=ulCornerTextY && y<ulCornerTextY+textHeight);
}

function addNeighbors(p){
  genFut[p-noOfSquX-3]+=2;
  genFut[p-noOfSquX-2]+=2;
  genFut[p-noOfSquX-1]+=2;
  genFut[p-1]+=2;
  genFut[p+1]+=2;
  genFut[p+noOfSquX+1]+=2;
  genFut[p+noOfSquX+2]+=2;
  genFut[p+noOfSquX+3]+=2;
}

function initDraw(){
    buf.clear();
    for (let y = 1; y<noOfSquY+1; y++){
      updateSecondText();
      for (let x = 1; x<noOfSquX+1; x++) {
        let ind = x+y*(noOfSquX+2);
        if(skipCell(x-1,y-1)){
          break; // rest of the line would be skipped, too
        }
        if(Math.random()<0.3){
          genFut[ind] += 1;
          addNeighbors(ind);
          var Xr=bigSquareSize*(x-1);
          var Yr=bigSquareSize*(y-1);
          buf.fillRect(Xr,Yr, Xr+squaresize,Yr+squaresize);
        }
      }
      flip(true); // experimental
    }
  flip(false);
  let tmp = genFut; genFut = genNow; genNow = tmp; // reference swapping
  genFut.fill(0);
}

let sleeptime = 0;

function howlong(){
  generation++;
  if(generation==genEnd){
    clearLinesFirstFewGens();
    fillLinesLaterGens();
  }
  g.setFont("6x8",2);
  g.setFontAlign(-1,-1,0);
  let gentime = Math.floor(Date.now()-lastupdatetime-sleeptime);
  lastupdatetime = Date.now();
  sleeptime = 0;
  g.drawString('Gen:'+generation+'  '+gentime+'ms  ',20,220,true);
}

let lastDate=null;
let lastGen=-1;

function improveLetter(textPreBuf, char, x,y){
  switch(char){
    case "0":{
        textPreBuf.setColor(1);
        textPreBuf.drawString(".",x-1,y-4);
        textPreBuf.drawString(".",x+1,y-4);
        textPreBuf.drawString(".",x-1,y);
        textPreBuf.drawString(".",x+1,y);
        return;}
    case "2":{
        textPreBuf.drawString(".",x+1,y-4);
        textPreBuf.drawString(".",x+1,y-2);
        textPreBuf.drawString(".",x-1,y-2);
        return;}
    case "3":{
        textPreBuf.drawString(".",x+1,y-4);
        textPreBuf.drawString(".",x+1,y-2);
        textPreBuf.drawString(".",x+1,y);
        return;}
    case "4":{
        textPreBuf.setColor(0);
        textPreBuf.drawString(".",x,y-4);
        textPreBuf.drawString(".",x-1,y-3);
        textPreBuf.setColor(1);
        textPreBuf.drawString(".",x,y-3);
        return;}
    case "5":{
        textPreBuf.drawString(".",x-1,y-2);
        textPreBuf.drawString(".",x+1,y-2);
        textPreBuf.drawString(".",x+1,y);
        return;}
    case "6":{
        textPreBuf.drawString(".",x-1,y-4);
        textPreBuf.drawString(".",x+1,y-2);
        textPreBuf.drawString(".",x-1,y);
        textPreBuf.drawString(".",x+1,y);
        return;}
    case "7":{
        textPreBuf.setColor(0);
        textPreBuf.drawString(".",x,y);
        textPreBuf.drawString(".",x,y-1);
        textPreBuf.setColor(1);
        textPreBuf.drawString(".",x+1,y);
        textPreBuf.drawString(".",x+1,y-1);
        return;}
    case "8":{
        textPreBuf.drawString(".",x-1,y-4);
        textPreBuf.drawString(".",x+1,y-4);
        textPreBuf.drawString(".",x-1,y-2);
        textPreBuf.drawString(".",x+1,y-2);
        textPreBuf.drawString(".",x-1,y);
        textPreBuf.drawString(".",x+1,y);
        return;}
    case "9":{
        textPreBuf.drawString(".",x-1,y-4);
        textPreBuf.drawString(".",x+1,y-4);
        textPreBuf.drawString(".",x-1,y-2);
        textPreBuf.drawString(".",x-1,y);
        textPreBuf.drawString(".",x+1,y);
        return;}
    default: return;
  }
}

function fillMinTextBuf(date){
  textPreBufMin.clear();
  textPreBufMin.setColor(1);
  let hours = date.getHours();
  if (is12Hour) {hours = ((hours + 11) % 12) + 1;}
  let hourStr = ("0"+hours).slice(-2);
  let minStr = ("0"+date.getMinutes()).slice(-2);
  textPreBufMin.drawString(hourStr[0],1,1);
  improveLetter(textPreBufMin, hourStr[0],1,1);
  textPreBufMin.drawString(hourStr[1],5,1);
  improveLetter(textPreBufMin, hourStr[1],5,1);
  textPreBufMin.drawString(":",8,0);
  textPreBufMin.drawString(minStr[0],11,1);
  improveLetter(textPreBufMin, minStr[0],11,1);
  textPreBufMin.drawString(minStr[1],15,1);
  improveLetter(textPreBufMin, minStr[1],15,1);
}

function updateMinuteText(date){
  fillMinTextBuf(date);
  textbufMin.clear();
  g.setColor(1,1,1);
  for(let i = 0; i<textPreBufMin.buffer.length; i++){
    if(textPreBufMin.buffer[i]==0){continue;}
    let x = i%(textWidth-sectextWidth);
    let y = parseInt(i/(textWidth-sectextWidth));

    let Xr=bigSquareSize*(x);
    let Yr=bigSquareSize*(y);
    textbufMin.fillRect(Xr,Yr, Xr+squaresize,Yr+squaresize);
  }
  g.clearRect(ulCornerTextXScreen,ulCornerTextYScreen,
              ulCornerTextXScreen+textWidthScreen-textWidthScreenSec,
              ulCornerTextYScreen+textHeightScreen-1);
  fillLinesFirstFewGens();

  g.drawImage({width:textWidthScreen-textWidthScreenSec,
               height:textHeightScreen,
               bpp:1,transparent:0,buffer:textbufMin.buffer},
               ulCornerTextXScreen,ulCornerTextYScreen);
}

function updateSecondText(){
  let startDate = new Date();
  if(lastDate && lastDate.getSeconds() == startDate.getSeconds()){
    return;
  }
  textPreBufSec.clear();
  textPreBufSec.setColor(1);
  textbufSec.clear();
  if(!lastDate||(generation<genEnd && lastDate.getMinutes() != startDate.getMinutes())){
    updateMinuteText(startDate);
  }
  let secStr = ("0"+startDate.getSeconds()).slice(-2);
  textPreBufSec.drawString(secStr[0],1,1);
  improveLetter(textPreBufSec, secStr[0],1,1);
  textPreBufSec.drawString(secStr[1],5,1);
  improveLetter(textPreBufSec, secStr[1],5,1);

  g.setColor(1,1,1);
  for(let i = 0; i<textPreBufSec.buffer.length; i++){
    if(textPreBufSec.buffer[i]==0){continue;}
    let x = i%sectextWidth;
    let y = parseInt(i/sectextWidth);
    if (textPreBufSec.buffer[i]==1){
      let Xr=bigSquareSize*(x);
      let Yr=bigSquareSize*(y);
      textbufSec.fillRect(Xr,Yr, Xr+squaresize,Yr+squaresize);
    }
  }
  renderSecText();

  lastDate = startDate;
}

function writeMinuteText(){
  for(let i = 0; i<textPreBufMin.buffer.length; i++){
    if(textPreBufMin.buffer[i]==0){continue;}
    let x = i%(textWidth-sectextWidth);
    let y = parseInt(i/(textWidth-sectextWidth));
    let ind = (ulCornerTextX+x+1)+(ulCornerTextY+y+1)*(noOfSquX+2);

    genFut[ind] +=1;
    addNeighbors(ind);
  }
}

let currentY = 1;
let runOn = true;

function nextLineComp(){
  updateSecondText();
  let y = currentY;
  for (let x = 1; x<noOfSquX+1; x++){
      if(skipCell(x-1,y-1)){break;} // the rest of this line would be skipped, too
      let ind = x+y*(noOfSquX+2);
      if (genNow[ind]>4 && genNow[ind]<8){
        genFut[ind]+=1;
        addNeighbors(ind);
        let Xr=bigSquareSize*(x-1);
        let Yr=bigSquareSize*(y-1);
        buf.fillRect(Xr,Yr, Xr+squaresize,Yr+squaresize);
      }
  }
  if(y == noOfSquY){
    if(generation == genEnd-1){writeMinuteText();}
    flip();
    let tmp = genFut; genFut = genNow; genNow = tmp; // reference swapping
    genFut.fill(0);
    howlong();
    currentY = 1;
  }
  else{
    currentY++;
  }
  if(runOn){setTimeout(nextLineComp, 50);}
}

function stopdraw() {
  runOn = false;
}

function startdraw(init) {
  if (init===undefined) init=false;
  Bangle.drawWidgets();
  g.reset();
  g.setColor(1,1,1);
  g.setFont("6x8",1);
  g.setFontAlign(0,0,3);
  g.drawString("RESET",230,200);
  g.drawString("LAUNCH",230,130);
  g.drawString("CLOCK",230,60);
  if(!init){
    updateSecondText();
    // stopdraw();
    runOn = true;
    sleeptime = 0;
    nextLineComp();
  }
}

function regen(){
  g.setColor(1,1,1);
  generation = 0;
  genEnd = minuteGens;
  currentY=1;
  g.setFont("6x8",2);
  g.setFontAlign(-1,-1,0);
  g.clearRect(20,220,220,240);
  g.drawString('Gen:'+generation+'  0ms  ',20,220,true);
  lastupdatetime=Date.now();
  updateSecondText();
  genNow.fill(0);
  genFut.fill(0);
  initDraw();
  // stopdraw();
  runOn = true;
  sleeptime = 0;
  nextLineComp();
}

function showMinAgain(){
  if(genEnd != generation+minuteGens){
    genEnd = generation+minuteGens;
    lastDate = null;
  }
}

function setButtons(){
  setWatch(showMinAgain, BTN1, {repeat:true,edge:"falling"});
  setWatch(Bangle.showLauncher, BTN2, {repeat:false,edge:"falling"});
  setWatch(regen, BTN3, {repeat:true,edge:"falling"});
}

let wentToSleepAt;

var SCREENACCESS = {
  withApp:true,
  request:function(){
    this.withApp=false;
    stopdraw();
    wentToSleepAt = Date.now();
  },
  release:function(){
    this.withApp=true;
    sleeptime = Date.now()-wentToSleepAt;
    startdraw();
  }
};

Bangle.on('lcdPower',function(on) {
  if (!SCREENACCESS.withApp) return;
  if (on) {
    startdraw();
    sleeptime = Date.now()-wentToSleepAt;
  } else {
    stopdraw();
    wentToSleepAt = Date.now();
  }
});

g.clear();
Bangle.loadWidgets();
setButtons();
regen();
startdraw(true);
