const glob = require('glob');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const extractColors = require('./helpers/extractColors');
const readImageData = require('./helpers/readImageData');
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

  it('should support aligning text', async () => {
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_right_align.png',
      textAlign: 'right',
    });
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '2_center_align.png',
      textAlign: 'center',
    });
    await imageGenerator.generate('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '3_left_align.png',
      textAlign: 'left',
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const rightAlignImg = fs.readFileSync(images[0]);
    const rightAlignData = await readImageData(rightAlignImg);
    const centerAlignImg = fs.readFileSync(images[1]);
    const centerAlignData = await readImageData(centerAlignImg);
    const leftAlignImg = fs.readFileSync(images[2]);
    const leftAlignData = await readImageData(leftAlignImg);

    // expect the pixel at top: 19, left: 13 to have text
    expect(rightAlignData.frames[0].data[400 * 19 * 4 - 13 * 4]).not.toEqual(
      0xff,
    );
    // expect the pixel at top: 19, right: 13 to not have text
    expect(rightAlignData.frames[0].data[400 * 19 * 4 + 13 * 4]).toEqual(0xff);

    expect(centerAlignData.frames[0].data[400 * 19 * 4 - 13 * 4]).toEqual(0xff);
    expect(centerAlignData.frames[0].data[400 * 19 * 4 - 206 * 4]).not.toEqual(
      0xff,
    );
    expect(centerAlignData.frames[0].data[400 * 19 * 4 + 13 * 4]).toEqual(0xff);

    expect(leftAlignData.frames[0].data[400 * 19 * 4 - 13 * 4]).toEqual(0xff);
    expect(leftAlignData.frames[0].data[400 * 19 * 4 + 13 * 4]).not.toEqual(
      0xff,
    );
  });
});

describe('the text-to-image generator (sync)', () => {
  afterEach(() => {
    // remove all pngs created by the lib in debug mode
    const pngs = glob.sync(path.join(process.cwd(), '*.png'));
    pngs.forEach(item => {
      fs.unlinkSync(item);
    });
    delete process.env.DEBUG;
  });

  it('should return a data url', done => {
    expect(typeof imageGenerator.generateSync('Hello world')).toBe('string');
    done();
  });

  it('should generate an image data url', async () => {
    await expect(imageGenerator.generateSync('Hello world')).toMatch(
      /^data:image\/png;base64/,
    );
  });

  it('should create a png file in debug mode', () => {
    imageGenerator.generateSync('Hello world', {
      debug: true,
    });
    expect(glob.sync(path.join(process.cwd(), '*.png')).length).toEqual(1);
  });

  it('should not create a file if not in debug mode', () => {
    imageGenerator.generateSync('Hello world');
    expect(glob.sync(path.join(process.cwd(), '*.png')).length).toEqual(0);
  });

  it("should generate equal width but longer png when there's plenty of text", async () => {
    imageGenerator.generateSync('Hello world', {
      debug: true,
    });

    imageGenerator.generateSync(
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
    imageGenerator.generateSync('Hello world', {
      debug: true,
    });
    imageGenerator.generateSync('Hello world\nhello again', {
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
    imageGenerator.generateSync('Hello world\nhello again', {
      debug: true,
    });
    imageGenerator.generateSync('Hello world\n\n\nhello again', {
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
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
      debug: true,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const dimensions = sizeOf(images[0]);

    expect(dimensions.width).toEqual(400);
  });

  it('should be configurable to use another image width', async () => {
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
      debug: true,
      maxWidth: 500,
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const dimensions = sizeOf(images[0]);

    expect(dimensions.width).toEqual(500);
  });

  it('should default to a white background no transparency', async () => {
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
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
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
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

    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
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

    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
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
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_bold.png',
      fontWeight: 'bold',
    });
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
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

  it('should support aligning text', async () => {
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '1_right_align.png',
      textAlign: 'right',
    });
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '2_center_align.png',
      textAlign: 'center',
    });
    imageGenerator.generateSync('Lorem ipsum dolor sit amet.', {
      debug: true,
      debugFilename: '3_left_align.png',
      textAlign: 'left',
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    const rightAlignImg = fs.readFileSync(images[0]);
    const rightAlignData = await readImageData(rightAlignImg);
    const centerAlignImg = fs.readFileSync(images[1]);
    const centerAlignData = await readImageData(centerAlignImg);
    const leftAlignImg = fs.readFileSync(images[2]);
    const leftAlignData = await readImageData(leftAlignImg);

    // expect the pixel at top: 19, left: 13 to have text
    expect(rightAlignData.frames[0].data[400 * 19 * 4 - 13 * 4]).not.toEqual(
      0xff,
    );
    // expect the pixel at top: 19, right: 13 to not have text
    expect(rightAlignData.frames[0].data[400 * 19 * 4 + 13 * 4]).toEqual(0xff);

    expect(centerAlignData.frames[0].data[400 * 19 * 4 - 13 * 4]).toEqual(0xff);
    expect(centerAlignData.frames[0].data[400 * 19 * 4 - 206 * 4]).not.toEqual(
      0xff,
    );
    expect(centerAlignData.frames[0].data[400 * 19 * 4 + 13 * 4]).toEqual(0xff);

    expect(leftAlignData.frames[0].data[400 * 19 * 4 - 13 * 4]).toEqual(0xff);
    expect(leftAlignData.frames[0].data[400 * 19 * 4 + 13 * 4]).not.toEqual(
      0xff,
    );
  });
});
