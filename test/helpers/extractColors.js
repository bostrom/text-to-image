"use strict";

module.exports = extractColors;

function extractColors(image) {
  var pixels = image.frames[0].data;
  var colorMap = {};
  for (var i = 0; i < pixels.length; i += 4) {
    var r = pixels[i],
      g = pixels[i + 1],
      b = pixels[i + 2];
      // a = pixels[i + 3]

    var hexNotation = '#' + paddedHex(r) + paddedHex(g) + paddedHex(b);
    var currValue = colorMap[hexNotation];
    if (currValue) {
      currValue += 1;
    } else {
      currValue = 1;
    }
    colorMap[hexNotation] = currValue;
  }

  return colorMap;
}

function paddedHex(intVal) {
  var s = intVal.toString(16);
  if (s.length === 1) {
    s = "0" + s;
  }

  return s;
}
