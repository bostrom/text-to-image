import fs from 'fs';
import Canvas from 'canvas';

const defaults = {
  debug: false,
  maxWidth: 400,
  fontSize: 18,
  lineHeight: 28,
  margin: 10,
  bgColor: '#fff',
  textColor: '#000',
  fontFamily: 'Helvetica',
  fontPath: null,
  fontWeight: 'normal',
  customHeight: 0,
  textAlign: 'left',
  verticalAlign: 'top',
};

const createTextData = (
  text,
  maxWidth,
  fontSize,
  lineHeight,
  bgColor,
  textColor,
  fontFamily,
  fontPath,
  fontWeight,
  textAlign,
) => {
  // Register a custom font
  if (fontPath) {
    Canvas.registerFont(fontPath, { family: fontFamily });
  }

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
    // also trim the testLine since `line` will be empty in the beginning,
    // causing a leading white space character otherwise
    const testLine = `${line} ${word}`.trim();
    const testLineWidth = textContext.measureText(testLine).width;

    // if the line is marked as starting with a newline
    // OR if the line is too long, add a newline
    if (addNewLines.indexOf(n) > -1 || (testLineWidth > maxWidth && n > 0)) {
      // if the line exceeded the width with one additional word
      // just paint the line without the word
      textContext.fillText(line, textX, textY);

      // start a new line with the last word
      // and add the following (if this word was a newline word)
      line = word;

      // move the pen down
      textY += lineHeight;
    } else {
      // if not exceeded, just continue
      line = testLine;
    }
  }
  // paint the last line
  textContext.fillText(line, textX, textY);

  // increase the size of the text layer by the line height,
  // but in case the line height is less than the font size
  // we increase by font size in order to prevent clipping
  const height = textY + Math.max(lineHeight, fontSize);

  return textContext.getImageData(0, 0, maxWidth, height);
};

const createCanvas = (content, conf) => {
  // Get the text layer, not considering any
  // vertical whitespace beyond the text boundaries
  const textData = createTextData(
    content,
    // max width of text itself must be the image max width reduced by left-right margins
    conf.maxWidth - conf.margin * 2,
    conf.fontSize,
    conf.lineHeight,
    conf.bgColor,
    conf.textColor,
    conf.fontFamily,
    conf.fontPath,
    conf.fontWeight,
    conf.textAlign,
  );

  const textHeightWithMargins = textData.height + conf.margin * 2;

  if (conf.customHeight && conf.customHeight < textHeightWithMargins) {
    console.warn('Text is longer than customHeight, clipping will occur.');
  }

  const canvas = Canvas.createCanvas(
    conf.maxWidth,
    conf.customHeight || textHeightWithMargins,
  );
  const ctx = canvas.getContext('2d');

  ctx.globalAlpha = 1;
  ctx.fillStyle = conf.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const textX = conf.margin;
  let textY = conf.margin;
  if (conf.customHeight && conf.verticalAlign === 'center') {
    textY =
      // divide the leftover whitespace by 2
      (conf.customHeight - textData.height) / 2 +
      // offset for the extra space under the last line to make bottom and top whitespace equal
      // but only up until the bottom of the text
      // (i.e. don't consider a linheight less than the font size)
      Math.max(0, (conf.lineHeight - conf.fontSize) / 2);
  }

  ctx.putImageData(textData, textX, textY);

  return canvas;
};

const generateImage = async (content, config) => {
  const conf = { ...defaults, ...config };
  const canvas = createCanvas(content, conf);
  const dataUrl = canvas.toDataURL();

  if (conf.debug) {
    const fileName =
      conf.debugFilename ||
      `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;
    await fs.promises.writeFile(fileName, canvas.toBuffer());
  }

  return dataUrl;
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
  }

  return dataUrl;
};

module.exports = {
  generate: generateImage,
  generateSync: generateImageSync,
};
