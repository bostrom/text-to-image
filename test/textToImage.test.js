import glob from 'glob';
import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import extractColors from './helpers/extractColors';
import {
  uriToBuf,
  readImageData,
  countWhitePixels,
} from './helpers/readImageData';
import longInput from './helpers/longInput';
import { generate, generateSync } from '../src/textToImage';

// For development purposes only.
// We can't commit the snapshots since they
// will differ ever so slighly in the CI environment
// and fail our tests. So we use the snapshots only as
// regression detectors when developing (taking snapshots
// before refactor/feature and verifying that nothing changed
// after). To be disabled and snapshots removed before
// committing.
const snapshots = false;
function takeSnapshot(data) {
  if (snapshots) {
    expect(data).toMatchSnapshot();
  }
}

describe('the text-to-image generator', () => {
  afterEach(async () => {
    // remove all pngs created by the lib in debug mode
    const pngs = glob.sync(path.join(process.cwd(), '*.png'));
    await Promise.all(pngs.map((item) => fs.promises.unlink(item)));
    delete process.env.DEBUG;
  });

  it('should return a promise', (done) => {
    expect(generate('Hello world')).toBeInstanceOf(Promise);
    done();
  });

  it('should have a sync version', () => {
    expect(typeof generateSync('Hello world')).toEqual('string');
  });

  it('should support debug in sync mode', () => {
    generateSync('Hello world', {
      debug: true,
      debugFilename: '1_sync_debug.png',
    });

    const images = glob.sync(path.join(process.cwd(), '1_sync_debug.png'));
    expect(images.length).toBe(1);
  });

  it('should support custom filepaths in sync debug mode', async () => {
    const baseDir = path.join(process.cwd(), 'test', 'custom_path');
    const filePath = path.join(baseDir, 'to', '1_path_debug.png');
    generateSync('Hello world', {
      debug: true,
      debugFilename: filePath,
    });

    const images = glob.sync(filePath);
    expect(images.length).toBe(1);

    await fs.promises.rmdir(baseDir, {
      recursive: true,
      force: true,
    });
  });

  it('should support custom filepaths in async debug mode', async () => {
    const baseDir = path.join(process.cwd(), 'test', 'custom_path');
    const filePath = path.join(baseDir, 'to', '1_path_debug.png');
    await generate('Hello world', {
      debug: true,
      debugFilename: filePath,
    });

    const images = glob.sync(filePath);
    expect(images.length).toBe(1);

    await fs.promises.rmdir(baseDir, {
      recursive: true,
      force: true,
    });
  });

  it('should support default debug filename in sync mode', () => {
    generateSync('Hello world', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    expect(images.length).toBe(1);
  });

  it('should generate an image data url', async () => {
    const dataUri = await generate('Hello world');

    expect(dataUri).toMatch(/^data:image\/png;base64/);

    takeSnapshot(dataUri);
  });

  it('should create a png file in debug mode', async () => {
    await generate('Hello world', {
      debug: true,
    });

    const files = glob.sync(path.join(process.cwd(), '*.png'));
    expect(files.length).toEqual(1);
  });

  it('should not create a file if not in debug mode', async () => {
    await generate('Hello world');

    const files = glob.sync(path.join(process.cwd(), '*.png'));
    expect(files.length).toEqual(0);
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
    expect(dimensions1.height).toBeLessThan(dimensions2.height);
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
    expect(dimensions1.height).toBeLessThan(dimensions2.height);
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
    expect(dimensions1.height).toBeLessThan(dimensions2.height);
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

  it('should support speech bubble tail', async () => {
    const width = 300;
    const height = 50;
    const bubbleTailSize = { width: 50, height: 30 };

    const uri = await generate('This is Speech bubble', {
      maxWidth: width,
      height: height,
      bubbleTail: bubbleTailSize,
    });

    const imageData = await readImageData(uriToBuf(uri));

    const center = width / 2;

    // Check if there's a tail under the square.
    const whitePixels = countWhitePixels(
      imageData,
      center - 0.5,
      height,
      center + 0.5,
      height + bubbleTailSize.height,
    );

    // The alpha at the bottom vertex of 2 pixels is not 255.
    expect(whitePixels).toBe(bubbleTailSize.height - 2);
  });
});
