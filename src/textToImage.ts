import { createCanvas, registerFont, Canvas } from 'canvas';
import {
  GenerateFunction,
  ComputedOptions,
  GenerateOptionsAsync,
  GenerateOptionsSync,
  GenerateFunctionSync,
} from './@types';

const defaults = {
  bgColor: '#fff',
  customHeight: 0,
  fontFamily: 'Helvetica',
  fontPath: '',
  fontSize: 18,
  fontWeight: 'normal',
  lineHeight: 28,
  margin: 10,
  maxWidth: 400,
  textAlign: 'left' as const,
  textColor: '#000',
  verticalAlign: 'top',
  extensions: [],
};

const createTextData = (
  text: string,
  config: ComputedOptions,
  canvas?: Canvas,
) => {
  const {
    bgColor,
    fontFamily,
    fontPath,
    fontSize,
    fontWeight,
    lineHeight,
    maxWidth,
    textAlign,
    textColor,
  } = config;

  // Register a custom font
  if (fontPath) {
    registerFont(fontPath, { family: fontFamily });
  }

  // Use the supplied canvas (which should have a suitable width and height)
  // for the final image.
  // Or create a temporary canvas just for measuring how long the canvas
  // needs to be.
  const textCanvas = canvas ?? createCanvas(maxWidth, 100);
  const textContext = textCanvas.getContext('2d');

  // Set the text alignment and start position
  let textX = 0;
  let textY = 0;

  if (['center'].includes(textAlign.toLowerCase())) {
    textX = maxWidth / 2;
  }
  if (['right', 'end'].includes(textAlign.toLowerCase())) {
    textX = maxWidth;
  }
  textContext.textAlign = textAlign;

  // Set background color
  textContext.fillStyle = bgColor;
  textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);

  // Set text styles
  textContext.fillStyle = textColor;
  textContext.font = `${fontWeight.toString()} ${fontSize.toString()}px ${fontFamily}`;
  textContext.textBaseline = 'top';

  // Split the text into words
  const words = text.split(' ');
  let wordCount = words.length;

  // The start of the first line
  let line = '';
  const addNewLines = [];

  for (let n = 0; n < wordCount; n += 1) {
    let word: string = words[n];

    if (words[n].includes('\n')) {
      const parts = words[n].split('\n');
      // Use the first word before the newline(s)
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      word = parts.shift() || '';
      // Mark the next word as beginning with newline
      addNewLines.push(n + 1);
      // Return the rest of the parts to the words array at the same index
      words.splice(n + 1, 0, parts.join('\n'));
      wordCount += 1;
    }

    // Append one word to the line and see if its width exceeds the maxWidth.
    // Also trim the testLine since `line` will be empty in the
    // beginning, causing a leading white space character otherwise.
    // Use a negative lookbehind in the regex due to
    // https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS.
    const testLine = `${line} ${word}`.replace(/^ +|(?<! ) +$/g, '');
    const testLineWidth = textContext.measureText(testLine).width;

    // If the line is marked as starting with a newline or if the line is
    // too long, add a newline
    if (addNewLines.includes(n) || (testLineWidth > maxWidth && n > 0)) {
      // If the line exceeded the width with one additional word, just
      // paint the line without the word
      textContext.fillText(line, textX, textY);

      // Start a new line with the last word and add the following (if
      // this word was a newline word)
      line = word;

      // Move the pen down
      textY += lineHeight;
    } else {
      // If not exceeded, just continue
      line = testLine;
    }
  }

  // Paint the last line
  textContext.fillText(line, textX, textY);

  // Increase the size of the text layer by the line height
  // But in case the line height is less than the font size, we increase
  // by font size in order to prevent clipping.
  const height = textY + Math.max(lineHeight, fontSize);

  return {
    textHeight: height,
    textData: textContext.getImageData(0, 0, maxWidth, height),
  };
};

const createImageCanvas = (content: string, conf: ComputedOptions) => {
  // First pass: Measure the text so we can create a canvas big enough
  // to fit the text.
  // This has to be done since we can't resize the canvas on the fly
  // without losing the settings of the 2D context
  // https://github.com/Automattic/node-canvas/issues/1625
  const { textHeight } = createTextData(
    content,
    // Max width of text itself must be the image max width reduced by
    // left-right margins
    {
      maxWidth: conf.maxWidth - conf.margin * 2,
      fontSize: conf.fontSize,
      lineHeight: conf.lineHeight,
      bgColor: conf.bgColor,
      textColor: conf.textColor,
      fontFamily: conf.fontFamily,
      fontPath: conf.fontPath,
      fontWeight: conf.fontWeight,
      textAlign: conf.textAlign,
    } as ComputedOptions,
  );

  const textHeightWithMargins = textHeight + conf.margin * 2;

  if (conf.customHeight && conf.customHeight < textHeightWithMargins) {
    console.warn('Text is longer than customHeight, clipping will occur.');
  }

  // Second pass: We now know the height of the text on the canvas, so
  // let's create the final canvas with the given height and width and
  // pass that to createTextData so we can get the text data from it
  const height = conf.customHeight || textHeightWithMargins;
  const canvas = createCanvas(conf.maxWidth, height);

  const { textData } = createTextData(
    content,
    // Max width of text itself must be the image max width reduced by
    // left-right margins
    {
      maxWidth: conf.maxWidth - conf.margin * 2,
      fontSize: conf.fontSize,
      lineHeight: conf.lineHeight,
      bgColor: conf.bgColor,
      textColor: conf.textColor,
      fontFamily: conf.fontFamily,
      fontPath: conf.fontPath,
      fontWeight: conf.fontWeight,
      textAlign: conf.textAlign,
    } as ComputedOptions,
    canvas,
  );
  const ctx = canvas.getContext('2d');

  // The canvas will have the text from the first pass on it, so start by
  // clearing the whole canvas and start from a clean slate
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
  ctx.fillStyle = conf.bgColor;
  ctx.fillRect(0, 0, canvas.width, height);

  const textX = conf.margin;
  let textY = conf.margin;
  if (conf.customHeight && conf.verticalAlign === 'center') {
    textY =
      // Divide the leftover whitespace by 2
      (conf.customHeight - textData.height) / 2 +
      // Offset for the extra space under the last line to make bottom
      // and top whitespace equal.
      // But only up until the bottom of the text (i.e. don't consider a
      // line height less than the font size)
      Math.max(0, (conf.lineHeight - conf.fontSize) / 2);
  }

  ctx.putImageData(textData, textX, textY);

  return canvas;
};

export const generate: GenerateFunction<GenerateOptionsAsync> = async (
  content,
  config,
) => {
  const conf: ComputedOptions<GenerateOptionsAsync> = {
    ...defaults,
    ...config,
  };
  const canvas = createImageCanvas(content, conf);

  const finalCanvas = await conf.extensions.reduce<Promise<Canvas>>(
    async (prevCanvasPromise, extension) => {
      const resolvedPrev = await prevCanvasPromise;
      return extension(resolvedPrev, conf);
    },
    Promise.resolve(canvas),
  );

  const dataUrl = finalCanvas.toDataURL();
  return dataUrl;
};

export const generateSync: GenerateFunctionSync<GenerateOptionsSync> = (
  content,
  config,
) => {
  const conf: ComputedOptions<GenerateOptionsSync> = { ...defaults, ...config };
  const canvas = createImageCanvas(content, conf);

  const finalCanvas = conf.extensions.reduce<Canvas>(
    (prevCanvas, extension) => {
      return extension(prevCanvas, conf);
    },
    canvas,
  );

  const dataUrl = finalCanvas.toDataURL();
  return dataUrl;
};
