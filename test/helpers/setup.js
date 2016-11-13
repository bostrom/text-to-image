'use strict';

var chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  chaiThings = require('chai-things'),
  sinonChai = require("sinon-chai");

global.sinon = require('sinon');
global.expect = chai.expect;
global.should = chai.should();
global.assert = chai.assert;
chai.use(chaiAsPromised);
chai.use(chaiThings);
chai.use(sinonChai);

function paddedHex(intVal) {
  var s = intVal.toString(16);
  if (s.length == 1) {
    s = "0" + s;
  }
  return s;
}

global.extractColors = function(image) {
  var pixels = image.frames[0].data;
  var colorMap = new Map();
  for( var i = 0; i < pixels.length; i += 4 ) {
    var r = pixels[i],
        g = pixels[i + 1],
        b = pixels[i + 2],
        a = pixels[i + 3];

    var hexNotation = '#' + paddedHex(r) + paddedHex(g) + paddedHex(b);
    var currValue = colorMap.get(hexNotation);
    if( currValue ) {
      currValue++;
    } else {
      currValue = 1;
    }
    colorMap.set(hexNotation, currValue);
  }
  return colorMap;
}