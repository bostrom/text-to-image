const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');

const defaults = {
  debug: false,
  maxWidth: 400,
  fontSize: 18,
  lineHeight: 28,
  margin: 10,
  bgColor: '#fff',
  textColor: '#000',
  fontFamily: 'Helvetica',
  fontWeight: 'normal',
  customHeight: 0,
  textAlign: 'left',
};

const createTextData = (
  text,
  maxWidth,
  fontSize,
  lineHeight,
  bgColor,
  textColor,
  fontFamily,
  fontWeight,
  customHeight,
  textAlign,
) => {
  // create a tall context so we definitely can fit all text
  const textCanvas = Canvas.createCanvas(maxWidth, 1000);
  const textContext = textCanvas.getContext('2d');

  // set the text alignment and start position
  let textX = 0;
  let textY = 0;
  if (['center'].includes(textAlign.toLowerCase())) {
    textX = maxWidth / 2;
  }
  if (['right', 'end'].includes(textAlign.toLowerCase())) {
    textX = maxWidth;
  }
  textContext.textAlign = textAlign;

  // make background the color passed in
  textContext.fillStyle = bgColor;
  textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);

  // make text
  textContext.fillStyle = textColor;
  textContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  textContext.textBaseline = 'top';

  // split the text into words
  const words = text.split(' ');
  let wordCount = words.length;

  // the start of the first line
  let line = '';
  const addNewLines = [];

  for (let n = 0; n < wordCount; n += 1) {
    let word = words[n];

    if (/\n/.test(words[n])) {
      const parts = words[n].split('\n');
      // use the first word before the newline(s)
      word = parts.shift();
      // mark the next word as beginning with newline
      addNewLines.push(n + 1);
      // return the rest of the parts to the words array at the same index
      words.splice(n + 1, 0, parts.join('\n'));
      wordCount += 1;
    }

    // append one word to the line and see
    // if its width exceeds the maxWidth
    const testLine = `${line}${word} `;
    const testLineWidth = textContext.measureText(testLine).width;

    // if the line is marked as starting with a newline
    // OR if the line is too long, add a newline
    if (addNewLines.indexOf(n) > -1 || (testLineWidth > maxWidth && n > 0)) {
      // if the line exceeded the width with one additional word
      // just paint the line without the word
      textContext.fillText(line, textX, textY);

      // start a new line with the last word
      // and add the following (if this word was a newline word)
      line = `${word} `;

      // move the pen down
      textY += lineHeight;
    } else {
      // if not exceeded, just continue
      line = testLine;
    }
  }
  // paint the last line
  textContext.fillText(line, textX, textY);

  const height = customHeight || textY + lineHeight;

  return textContext.getImageData(0, 0, maxWidth, height);
};

const createCanvas = (content, conf) => {
  const textData = createTextData(
    content,
    conf.maxWidth - conf.margin,
    conf.fontSize,
    conf.lineHeight,
    conf.bgColor,
    conf.textColor,
    conf.fontFamily,
    conf.fontWeight,
    conf.customHeight,
    conf.textAlign,
  );

  const canvas = Canvas.createCanvas(
    conf.maxWidth,
    textData.height + conf.margin * 2,
  );
  const ctx = canvas.getContext('2d');

  ctx.globalAlpha = 1;
  ctx.fillStyle = conf.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.putImageData(textData, conf.margin, conf.margin);

  return canvas;
};

const generateImage = (content, config) => {
  const conf = { ...defaults, ...config };
  const canvas = createCanvas(content, conf);
  const dataUrl = canvas.toDataURL();

  if (conf.debug) {
    const fileName =
      conf.debugFilename ||
      `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;

    return new Promise(resolve => {
      const pngStream = canvas.createPNGStream();
      const out = fs.createWriteStream(path.join(process.cwd(), fileName));
      out.on('close', () => {
        resolve(dataUrl);
      });
      pngStream.pipe(out);
    });
  }

  return Promise.resolve(dataUrl);
};

const generateImageSync = (content, config) => {
  const conf = { ...defaults, ...config };
  const canvas = createCanvas(content, conf);
  const dataUrl = canvas.toDataURL();
  if (conf.debug) {
    const fileName =
      conf.debugFilename ||
      `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;
    fs.writeFileSync(fileName, canvas.toBuffer());
    return dataUrl;
  }
  return dataUrl;
};

module.exports = {
  generate: generateImage,
  generateSync: generateImageSync,
};
