import path from 'path';
import sizeOf from 'image-size';
import extractColors from './helpers/extractColors';
import {
  uriToBuf,
  readImageData,
  countWhitePixels,
} from './helpers/readImageData';
import longInput from './helpers/longInput';
import { generate, generateSync } from '../src';
import takeSnapshot from './helpers/takeSnapshot';
import { Canvas } from 'canvas';
import { ComputedOptions, Extension } from '../src/types';

describe('the text-to-image generator', () => {
  it('should return a promise', (done) => {
    expect(generate('Hello world')).toBeInstanceOf(Promise);
    done();
  });

  it('should have a sync version', () => {
    expect(typeof generateSync('Hello world')).toEqual('string');
  });

  it('should generate an image data url', async () => {
    const dataUri = await generate('Hello world');

    expect(dataUri).toMatch(/^data:image\/png;base64/);

    takeSnapshot(dataUri);
  });

  it("should generate equal width but longer png when there's plenty of text", async () => {
    const uri1 = await generate('Hello world');
    const uri2 = await generate(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut dolor eros, lobortis ac orci a, molestie sagittis libero.',
    );

    const image1 = uriToBuf(uri1);
    const image2 = uriToBuf(uri2);

    const dimensions1 = sizeOf(image1);
    const dimensions2 = sizeOf(image2);

    expect(dimensions1.height).toBeGreaterThan(0);
    expect(dimensions1.height).toBeLessThan(dimensions2.height || 0);
    expect(dimensions1.width).toEqual(dimensions2.width);

    takeSnapshot(uri1);
    takeSnapshot(uri2);
  });

  it('should create a new lines when a \\n occurrs', async () => {
    const uri1 = await generate('Hello world');
    const uri2 = await generate('Hello world\nhello again');

    const dimensions1 = sizeOf(uriToBuf(uri1));
    const dimensions2 = sizeOf(uriToBuf(uri2));

    expect(dimensions1.height).toBeGreaterThan(0);
    expect(dimensions1.height).toBeLessThan(dimensions2.height || 0);
    expect(dimensions1.width).toEqual(dimensions2.width);

    takeSnapshot(uri1);
    takeSnapshot(uri2);
  });

  it('should create a new lines when a multiple \\n occurrs', async () => {
    const uri1 = await generate('Hello world\nhello again');
    const uri2 = await generate('Hello world\n\n\nhello again');

    const dimensions1 = sizeOf(uriToBuf(uri1));
    const dimensions2 = sizeOf(uriToBuf(uri2));

    expect(dimensions1.height).toBeGreaterThan(0);
    expect(dimensions1.height).toBeLessThan(dimensions2.height || 0);
    expect(dimensions1.width).toEqual(dimensions2.width);

    takeSnapshot(uri1);
    takeSnapshot(uri2);
  });

  it('should default to a 400 px wide image', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.');

    const dimensions = sizeOf(uriToBuf(uri));

    expect(dimensions.width).toEqual(400);

    takeSnapshot(uri);
  });

  it('should be configurable to use another image width', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      maxWidth: 500,
    });

    const dimensions = sizeOf(uriToBuf(uri));
    expect(dimensions.width).toEqual(500);

    takeSnapshot(uri);
  });

  it('should default to a white background no transparency', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.');

    const image = await readImageData(uriToBuf(uri));

    expect(image.frames.length).toEqual(1);
    expect(image.frames[0].data[0]).toEqual(0xff);
    expect(image.frames[0].data[1]).toEqual(0xff);
    expect(image.frames[0].data[2]).toEqual(0xff);
    expect(image.frames[0].data[3]).toEqual(0xff);

    takeSnapshot(uri);
  });

  it('should use the background color specified with no transparency', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      bgColor: '#001122',
    });

    const image = await readImageData(uriToBuf(uri));

    expect(image.frames.length).toEqual(1);
    expect(image.frames[0].data[0]).toEqual(0x00);
    expect(image.frames[0].data[1]).toEqual(0x11);
    expect(image.frames[0].data[2]).toEqual(0x22);
    expect(image.frames[0].data[3]).toEqual(0xff);

    takeSnapshot(uri);
  });

  it('should default to a black text color', async () => {
    const WIDTH = 720;
    const HEIGHT = 220;

    const uri = await generate('Lorem ipsum dolor sit amet.', {
      maxWidth: WIDTH,
      fontSize: 100,
      lineHeight: 100,
    });

    const imageData = uriToBuf(uri);

    const dimensions = sizeOf(imageData);
    expect(dimensions.width).toEqual(WIDTH);
    expect(dimensions.height).toEqual(HEIGHT);

    const image = await readImageData(imageData);
    const map = extractColors(image);

    // GIMP reports 256 colors on this image
    expect(Object.keys(map).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(map).length).toBeLessThanOrEqual(256);
    expect(map['#000000']).toBeGreaterThan(10);
    expect(map['#ffffff']).toBeGreaterThan(100);

    takeSnapshot(uri);
  });

  it('should use the text color specified', async () => {
    const WIDTH = 720;
    const HEIGHT = 220;

    const uri = await generate('Lorem ipsum dolor sit amet.', {
      maxWidth: WIDTH,
      fontSize: 100,
      lineHeight: 100,
      textColor: '#112233',
    });

    const imageData = uriToBuf(uri);

    const dimensions = sizeOf(imageData);
    expect(dimensions.width).toEqual(WIDTH);
    expect(dimensions.height).toEqual(HEIGHT);

    const image = await readImageData(imageData);
    const map = extractColors(image);

    // GIMP reports 256 colors on this image
    expect(Object.keys(map).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(map).length).toBeLessThanOrEqual(256);
    expect(map['#000000']).toBeUndefined();
    expect(map['#112233']).toBeGreaterThan(10);
    expect(map['#ffffff']).toBeGreaterThan(100);

    takeSnapshot(uri);
  });

  it('should use the font weight specified', async () => {
    const uri1 = await generate('Lorem ipsum dolor sit amet.', {
      fontWeight: 'bold',
    });
    const uri2 = await generate('Lorem ipsum dolor sit amet.', {
      fontWeight: 'normal',
    });

    const boldImg = await readImageData(uriToBuf(uri1));
    const normalImg = await readImageData(uriToBuf(uri2));
    const boldMap = extractColors(boldImg);
    const normalMap = extractColors(normalImg);

    // check that we have more black and less white in the bold text image
    expect(boldMap['#000000']).toBeGreaterThan(normalMap['#000000']);
    expect(boldMap['#ffffff']).toBeLessThan(normalMap['#ffffff']);

    takeSnapshot(uri1);
    takeSnapshot(uri2);
  });

  it('should support right aligning text', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      textAlign: 'right',
    });

    const rightAlignData = await readImageData(uriToBuf(uri));

    // expect all pixels on left side (up to 150px) to be white
    const whitePixels = countWhitePixels(
      rightAlignData,
      0,
      0,
      150,
      rightAlignData.height,
    );
    expect(whitePixels).toBe(rightAlignData.height * 150);

    // expect some pixels on right side (from 150px) include non-white
    const nonWhitePixels = countWhitePixels(
      rightAlignData,
      150,
      0,
      rightAlignData.width,
      rightAlignData.height,
    );
    expect(nonWhitePixels).toBeLessThan(rightAlignData.height * 250);

    takeSnapshot(uri);
  });

  it('should support left aligning text', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      textAlign: 'left',
    });

    const leftAlignData = await readImageData(uriToBuf(uri));

    // expect all pixels on right side (from 250px) to be white
    const whitePixels = countWhitePixels(
      leftAlignData,
      250,
      0,
      leftAlignData.width,
      leftAlignData.height,
    );
    expect(whitePixels).toBe(leftAlignData.height * 150);

    // expect some pixels on left side (up to 250px) to be non-white
    const nonWhitePixels = countWhitePixels(
      leftAlignData,
      0,
      0,
      250,
      leftAlignData.height,
    );
    expect(nonWhitePixels).toBeLessThan(leftAlignData.height * 250);

    takeSnapshot(uri);
  });

  it('should support center aligning text', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      textAlign: 'center',
    });

    const centerAlignData = await readImageData(uriToBuf(uri));

    // expect all pixels on left side (up to 80px) to be white
    const leftWhitePixels = countWhitePixels(
      centerAlignData,
      0,
      0,
      80,
      centerAlignData.height,
    );
    expect(leftWhitePixels).toBe(centerAlignData.height * 80);

    // expect all pixels on left side (last 80px) to be white
    const rightWhitePixels = countWhitePixels(
      centerAlignData,
      centerAlignData.width - 80,
      0,
      centerAlignData.width,
      centerAlignData.height,
    );
    expect(rightWhitePixels).toBe(centerAlignData.height * 80);

    // expect some pixels in the center (between 80 and width-80) to be non-white
    const centerWhitePixels = countWhitePixels(
      centerAlignData,
      80,
      0,
      centerAlignData.width - 80,
      centerAlignData.height,
    );
    expect(centerWhitePixels).toBeLessThan(
      centerAlignData.height * (centerAlignData.width - 160),
    );

    takeSnapshot(uri);
  });

  it('should support custom height', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      customHeight: 100,
    });

    const customHeight = await readImageData(uriToBuf(uri));

    expect(customHeight.height).toEqual(100);

    takeSnapshot(uri);
  });

  it('should warn if the text is longer than customHeight', async () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    consoleSpy.mockImplementation(() => undefined);

    await generate(
      'Lorem ipsum dolor sit amet. Saturation point fluidity ablative weathered sunglasses soul-delay vehicle dolphin neon fetishism 3D-printed gang.',
      {
        customHeight: 20,
      },
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Text is longer than customHeight, clipping will occur.',
    );
  });

  it('should support vertical align', async () => {
    const uri = await generate('Lorem ipsum dolor sit amet.', {
      textAlign: 'center',
      verticalAlign: 'center',
      customHeight: 100,
    });

    const verticalCenter = await readImageData(uriToBuf(uri));

    // first 35 pixel rows should be white
    const topWhitePixels = countWhitePixels(
      verticalCenter,
      0,
      0,
      verticalCenter.width,
      35,
    );
    expect(topWhitePixels).toBe(verticalCenter.width * 35);

    // middle pixel rows should contain non-whites
    const centerWhitePixels = countWhitePixels(
      verticalCenter,
      0,
      35,
      verticalCenter.width,
      verticalCenter.height - 35,
    );
    expect(centerWhitePixels).toBeLessThan(
      verticalCenter.width * (verticalCenter.height - 70),
    );

    // bottom 35 rows should be white
    const bottomWhitePixels = countWhitePixels(
      verticalCenter,
      0,
      verticalCenter.height - 35,
      verticalCenter.width,
      verticalCenter.height,
    );
    expect(bottomWhitePixels).toBe(verticalCenter.width * 35);

    takeSnapshot(uri);
  });

  it('should support custom font paths', async () => {
    const uri = await generate('S', {
      // use a font that renders a black square with the 'S' character
      fontPath: path.resolve(__dirname, 'helpers', 'heydings_controls.ttf'),
      fontFamily: 'Heydings Controls',
      margin: 0,
    });

    const customFontData = await readImageData(uriToBuf(uri));
    // check that we only have black pixels in the rendered square
    const whitePixels = countWhitePixels(customFontData, 5, 9, 13, 17);
    expect(whitePixels).toBe(0);

    takeSnapshot(uri);
  });

  it('should support very long inputs', async () => {
    const uri = await generate(longInput, {});

    const imageData = await readImageData(uriToBuf(uri));
    expect(imageData.height).toBeGreaterThan(3000);

    takeSnapshot(uri);
  });

  it('should support leading tabs', async () => {
    const uri = await generate(
      `\tDuis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. Maecenas sed diam eget risus varius blandit sit amet non magna. Donec id elit non mi porta gravida at eget metus. \n\tAenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.`,
    );

    const imageData = await readImageData(uriToBuf(uri));
    // check that we only have only white pixels in the top left corner
    const whitePixels1 = countWhitePixels(imageData, 0, 0, 35, 35);
    expect(whitePixels1).toBe(35 * 35);

    const whitePixels2 = countWhitePixels(imageData, 0, 145, 35, 175);
    expect(whitePixels2).toBe(35 * (175 - 145));

    takeSnapshot(uri);
  });

  it('should support leading non-breaking spaces', async () => {
    const uri = await generate(
      `\xA0\xA0\xA0Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit. \n\xA0\xA0\xA0\xA0\xA0Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.`,
    );

    const imageData = await readImageData(uriToBuf(uri));
    // check that we only have only white pixels in the top left corner
    const whitePixels1 = countWhitePixels(imageData, 0, 0, 20, 30);
    expect(whitePixels1).toBe(20 * 30);

    const whitePixels2 = countWhitePixels(imageData, 0, 60, 30, 90);
    expect(whitePixels2).toBe(30 * 30);

    takeSnapshot(uri);
  });

  it('should not duplicate text with transparent background', async () => {
    const uri = await generate(`Cases in Kanyakum district`, {
      customHeight: 900,
      verticalAlign: 'center',
      bgColor: 'transparent',
    });

    const {
      frames: [{ data }],
    } = await readImageData(uriToBuf(uri));
    // the top 100 pixel rows should not have any data
    const topRowsData = data.slice(0, 400 * 100 * 4); // 400px wide, 100px high, 4 values per pixel
    const rgbaSum = topRowsData.reduce((acc, cur) => acc + cur, 0);

    expect(rgbaSum).toBe(0);
  });

  it('should support extensions', async () => {
    expect.assertions(2);
    await generate('Lorem ipsum dolor sit amet.', {
      customHeight: 200,
      extensions: [
        (canvas: Canvas, conf: ComputedOptions) => {
          expect(canvas.height).toBe(200);
          expect(conf.customHeight).toBe(200);
          return canvas;
        },
      ],
    });
  });
});
