'use strict';

var fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird'),
  Canvas = require('canvas'),
  _ = require('lodash'),
  defaults = {
    debug: false,
    maxWidth: 400,
    fontSize: 18,
    lineHeight: 28,
    margin: 10
  };

function generateImage(content, config) {
  var conf = _.defaults(config, defaults);

  // select background or use default if not specified
  var background = '#fff';
  if (conf.bgColor) {
    background = conf.bgColor;
  }

  var textColor = '#000';
  if (conf.textColor) {
    textColor = conf.textColor;
  }

  var textData = createTextData(content, conf.maxWidth - conf.margin, conf.fontSize, conf.lineHeight, background, textColor);

  var canvas = new Canvas(conf.maxWidth, textData.height + conf.margin * 2),
    ctx = canvas.getContext('2d');

  ctx.globalAlpha = 1;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.putImageData(textData, conf.margin, conf.margin);

  var dataUrl = canvas.toDataURL();

  if (conf.debug) {
    return new Promise(function (resolve, reject) {
      var pngStream = canvas.createPNGStream();
      var out = fs.createWriteStream(path.join(process.cwd(), new Date().toISOString().replace(/[\W\.]/g, '') + '.png'));
      out.on('close', function () {
        resolve(dataUrl);
      });
      pngStream.pipe(out);
    });
  }

  return Promise.resolve(dataUrl);
}


function createTextData(text, maxWidth, fontSize, lineHeight, bgColor, textColor) {
  // create a tall context so we definitely can fit all text
  var textCanvas = new Canvas(maxWidth, 1000),
    textContext = textCanvas.getContext('2d'),
    textX = 0,
    textY = 0;

  // make background the color passed in
  textContext.fillStyle = bgColor;
  textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);

  // make text
  textContext.fillStyle = textColor;
  textContext.font = 'normal ' + fontSize + 'px Helvetica';
  textContext.textBaseline = 'top';

  // split the text into words
  var words = text.split(' ');

  // the start of the first line
  var line = '';

  for (var n = 0; n < words.length; n++) {
    // append one word to the line and see
    // if its width exceeds the maxWidth
    var testLine = line + words[n] + ' ';
    var testLineWidth = textContext.measureText(testLine).width;

    if (testLineWidth > maxWidth && n > 0) {
      // if the line exceeded the width with one additional word
      // just paint the line without the word
      textContext.fillText(line, textX, textY);

      // start a new line with the last word
      line = words[n] + ' ';

      // move the pen down
      textY += lineHeight;
    } else {
      // if not exceeded, just continue
      line = testLine;
    }
  }
  // paint the last line
  textContext.fillText(line, textX, textY);

  return textContext.getImageData(0, 0, maxWidth, textY + lineHeight);
}

module.exports = {
  generate: generateImage
};
