import { generate } from '../src';
import {
  countWhitePixels,
  readImageData,
  uriToBuf,
} from './helpers/readImageData';
import bubbleTail from '../src/extensions/bubbleTail';

describe('bubbleTail extension', () => {
  it('should not print a speech bubble tail if zero height or width given', async () => {
    expect.assertions(1);
    const height = 300;
    await generate('This is Speech bubble', {
      maxWidth: 300,
      customHeight: height,
      extensions: [
        bubbleTail({ height: 0, width: 0 }),
        (canvas) => {
          // canvas height should not change
          expect(canvas.height).toBe(height);
          return canvas;
        },
      ],
    });
  });

  it('should not print a speech bubble tail if negative height or width given', async () => {
    expect.assertions(1);
    const height = 300;
    await generate('This is Speech bubble', {
      maxWidth: 300,
      customHeight: height,
      extensions: [
        bubbleTail({ height: -1, width: -1 }),
        (canvas) => {
          // canvas height should not change
          expect(canvas.height).toBe(height);
          return canvas;
        },
      ],
    });
  });

  it('should support speech bubble tail', async () => {
    const width = 300;
    const height = 50;
    const bubbleTailConf = { width: 50, height: 30 };

    const uri = await generate('This is Speech bubble', {
      maxWidth: width,
      extensions: [bubbleTail(bubbleTailConf)],
    });

    const imageData = await readImageData(uriToBuf(uri));

    const center = width / 2;

    // Check if there's a tail under the square.
    const whitePixels = countWhitePixels(
      imageData,
      center - 0.5,
      height,
      center + 0.5,
      height + bubbleTailConf.height,
    );

    // The alpha at the bottom vertex of 2 pixels is not 255.
    expect(whitePixels).toBe(bubbleTailConf.height - 2);
  });
});
