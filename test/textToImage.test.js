const glob = require('glob');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const extractColors = require('./helpers/extractColors');
const { readImageData, countWhitePixels } = require('./helpers/readImageData');
const imageGenerator = require('../lib/textToImage');

describe('the text-to-image generator', () => {
  afterEach(() => {
    // remove all pngs created by the lib in debug mode
    const pngs = glob.sync(path.join(process.cwd(), '*.png'));
    pngs.forEach(item => {
      fs.unlinkSync(item);
    });
    delete process.env.DEBUG;
  });

  it('should return a promise', done => {
    expect(imageGenerator.generate('Hello world')).toBeInstanceOf(Promise);
    done();
  });

  it('should have a sync version', () => {
    expect(typeof imageGenerator.generateSync('Hello world')).toEqual('string');
  });

  it('should support debug in sync mode', () => {
    imageGenerator.generateSync('Hello world', {
      debug: true,
      debugFilename: '1_sync_debug.png',
    });

    const images = glob.sync(path.join(process.cwd(), '1_sync_debug.png'));
    expect(images.length).toBe(1);
  });

  it('should support default debug filename in sync mode', () => {
    imageGenerator.generateSync('Hello world', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    expect(images.length).toBe(1);
  });

  it('should generate an image data url', async () => {
    await expect(imageGenerator.generate('Hello world')).resolves.toMatch(
      /^data:image\/png;base64/,
    );
  });

  it('should create a png file in debug mode', () =>
    imageGenerator
      .generate('Hello world', {
        debug: true,
      })
      .then(() => {
        expect(glob.sync(path.join(process.cwd(), '*.png')).length).toEqual(1);
      }));

  it('should not create a file if not in debug mode', () =>
    imageGenerator.generate('Hello world').then(() => {
      expect(glob.sync(path.join(process.cwd(), '*.png')).length).toEqual(0);
    }));

  it("should generate equal width but longer png when there's plenty of text", async () => {
    await imageGenerator.generate('Hello world', {
      debug: true,
    });

    await imageGenerator.generate(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut dolor eros, lobortis ac orci a, molestie sagittis libero.',
      {
        debug: true,
      },
    );

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    // expect(images).to.have.lengthOf(2);
    const dimensions1 = sizeOf(images[0]);
    const dimensions2 = sizeOf(images[1]);

    expect(dimensions1.height).toBeGreaterThan(0);
    expect(dimensions1.height).toBeLessThan(dimensions2.height);
    expect(dimensions1.width).toEqual(dimensions2.width);
  });

  it('should create a new lines when a \\n occurrs', async () => {
    await imageGenerator.generate('Hello world', {
      debug: true,
    });
    await imageGenerator.generate('Hello world\nhello again', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    // expect(images).to.have.lengthOf(2);
    const dimensions1 = sizeOf(images[0]);
    const dimensions2 = sizeOf(images[1]);

    expect(dimensions1.height).toBeGreaterThan(0);
    expect(dimensions1.height).toBeLessThan(dimensions2.height);
    expect(dimensions1.width).toEqual(dimensions2.width);
  });

  it('should create a new lines when a multiple \\n occurrs', async () => {
    await imageGenerator.generate('Hello world\nhello again', {
      debug: true,
    });
    await imageGenerator.generate('Hello world\n\n\nhello again', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    // expect(images).to.have.lengthOf(2);
    const dimensions1 = sizeOf(images[0]);
    const dimensions2 = sizeOf(images[1]);

    expect(dimensions1.height).toBeGreaterThan(0);
    expect(dimensions1.height).toBeLessThan(dimensions2.height);
    expect(dimensions1.width).toEqual(dimensions2.width);
  });

  it('should default to a 400 px wide image', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const dimensions = sizeOf(images[0]);

    expect(dimensions.width).toEqual(400);
  });

  it('should be configurable to use another image width', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      maxWidth: 500,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const dimensions = sizeOf(images[0]);

    expect(dimensions.width).toEqual(500);
  });

  it('should default to a white background no transparency', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const imageData = fs.readFileSync(images[0]);

    const image = await readImageData(imageData);

    expect(image.frames.length).toEqual(1);
    expect(image.frames[0].data[0]).toEqual(0xff);
    expect(image.frames[0].data[1]).toEqual(0xff);
    expect(image.frames[0].data[2]).toEqual(0xff);
    expect(image.frames[0].data[3]).toEqual(0xff);
  });

  it('should use the background color specified with no transparency', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      bgColor: '#001122',
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const imageData = fs.readFileSync(images[0]);

    const image = await readImageData(imageData);

    expect(image.frames.length).toEqual(1);
    expect(image.frames[0].data[0]).toEqual(0x00);
    expect(image.frames[0].data[1]).toEqual(0x11);
    expect(image.frames[0].data[2]).toEqual(0x22);
    expect(image.frames[0].data[3]).toEqual(0xff);
  });

  it('should default to a black text color', async () => {
    const WIDTH = 720;
    const HEIGHT = 220;

    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      maxWidth: WIDTH,
      fontSize: 100,
      lineHeight: 100,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const dimensions = sizeOf(images[0]);

    expect(dimensions.width).toEqual(WIDTH);
    expect(dimensions.height).toEqual(HEIGHT);

    const imageData = fs.readFileSync(images[0]);
    const image = await readImageData(imageData);
    const map = extractColors(image);

    // GIMP reports 256 colors on this image
    expect(Object.keys(map).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(map).length).toBeLessThanOrEqual(256);
    expect(map['#000000']).toBeGreaterThan(10);
    expect(map['#ffffff']).toBeGreaterThan(100);
  });

  it('should use the text color specified', async () => {
    const WIDTH = 720;
    const HEIGHT = 220;

    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      maxWidth: WIDTH,
      fontSize: 100,
      lineHeight: 100,
      textColor: '#112233',
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const dimensions = sizeOf(images[0]);

    expect(dimensions.width).toEqual(WIDTH);
    expect(dimensions.height).toEqual(HEIGHT);

    const imageData = fs.readFileSync(images[0]);
    const image = await readImageData(imageData);
    const map = extractColors(image);

    // GIMP reports 256 colors on this image
    expect(Object.keys(map).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(map).length).toBeLessThanOrEqual(256);
    expect(map['#000000']).toBeUndefined();
    expect(map['#112233']).toBeGreaterThan(10);
    expect(map['#ffffff']).toBeGreaterThan(100);
  });

  it('should use the font weight specified', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_bold.png',
      fontWeight: 'bold',
    });
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '2_normal.png',
      fontWeight: 'normal',
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const boldFontData = fs.readFileSync(images[0]);
    const normalFontData = fs.readFileSync(images[1]);
    const boldImg = await readImageData(boldFontData);
    const normalImg = await readImageData(normalFontData);
    const boldMap = extractColors(boldImg);
    const normalMap = extractColors(normalImg);

    // check that we have more black and less white in the bold text image
    expect(boldMap['#000000']).toBeGreaterThan(normalMap['#000000']);
    expect(boldMap['#ffffff']).toBeLessThan(normalMap['#ffffff']);
  });

  it('should support right aligning text', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_right_align.png',
      textAlign: 'right',
    });

    const images = glob.sync(path.join(process.cwd(), '1_right_align.png'));
    const rightAlignImg = fs.readFileSync(images[0]);
    const rightAlignData = await readImageData(rightAlignImg);

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
  });

  it('should support left aligning text', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_left_align.png',
      textAlign: 'left',
    });

    const images = glob.sync(path.join(process.cwd(), '1_left_align.png'));
    const leftAlignImg = fs.readFileSync(images[0]);
    const leftAlignData = await readImageData(leftAlignImg);

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
  });

  it('should support center aligning text', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_center_align.png',
      textAlign: 'center',
    });

    const images = glob.sync(path.join(process.cwd(), '1_center_align.png'));
    const centerAlignImg = fs.readFileSync(images[0]);
    const centerAlignData = await readImageData(centerAlignImg);

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
  });

  it('should support custom height', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_custom_height.png',
      customHeight: 100,
    });

    const images = glob.sync(path.join(process.cwd(), '1_custom_height.png'));
    const customHeightImg = fs.readFileSync(images[0]);
    const customHeight = await readImageData(customHeightImg);

    expect(customHeight.height).toEqual(100);
  });

  it('should warn if the text is longer than customHeight', async () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    consoleSpy.mockImplementation(() => {});

    await imageGenerator.generate(
      'Lorem ipsum dolor sit amet. Saturation point fluidity ablative weathered sunglasses soul-delay vehicle dolphin neon fetishism 3D-printed gang.',
      {
        debug: true,
        debugFilename: '1_custom_height_overflow.png',
        customHeight: 20,
      },
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Text is longer than customHeight, clipping will occur.',
    );
  });

  it('should support vertical align', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_vertical_center.png',
      textAlign: 'center',
      verticalAlign: 'center',
      customHeight: 100,
    });

    const images = glob.sync(path.join(process.cwd(), '1_vertical_center.png'));
    const verticalCenterImg = fs.readFileSync(images[0]);
    const verticalCenter = await readImageData(verticalCenterImg);

    // first 40 pixel rows should be white
    const topWhitePixels = countWhitePixels(
      verticalCenter,
      0,
      0,
      verticalCenter.width,
      40,
    );
    expect(topWhitePixels).toBe(verticalCenter.width * 40);

    // middle pixel rows should contain non-whites
    const centerWhitePixels = countWhitePixels(
      verticalCenter,
      0,
      40,
      verticalCenter.width,
      verticalCenter.height - 40,
    );
    expect(centerWhitePixels).toBeLessThan(
      verticalCenter.width * (verticalCenter.height - 80),
    );

    // bottom 40 rows should be white
    const bottomWhitePixels = countWhitePixels(
      verticalCenter,
      0,
      verticalCenter.height - 40,
      verticalCenter.width,
      verticalCenter.height,
    );
    expect(bottomWhitePixels).toBe(verticalCenter.width * 40);
  });

  it('should support custom font paths', async () => {
    await imageGenerator.generate('S', {
      debug: true,
      debugFilename: '1_font_path.png',
      // use a font that renders a black square with the 'S' character
      fontPath: path.resolve(__dirname, 'helpers', 'heydings_controls.ttf'),
      fontFamily: 'Heydings Controls',
      margin: 0,
    });

    const images = glob.sync(path.join(process.cwd(), '1_font_path.png'));
    const customFontImg = fs.readFileSync(images[0]);
    const customFontData = await readImageData(customFontImg);
    // check that we only have black pixels in the rendered square
    const whitePixels = countWhitePixels(customFontData, 20, 9, 28, 17);
    expect(whitePixels).toBe(0);
  });
});
