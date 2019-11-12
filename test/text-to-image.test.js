const glob = require('glob');
const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const readimage = require('readimage');
const extractColors = require('./helpers/extractColors');
const imageGenerator = require('../lib/text-to-image');

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

  it('should generate an image data url', () =>
    expect(imageGenerator.generate('Hello world')).resolves.toMatch(
      /^data:image\/png;base64/,
    ));

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

  it("should generate equal width but longer png when there's plenty of text", () =>
    Promise.all([
      imageGenerator.generate('Hello world', {
        debug: true,
      }),
      imageGenerator.generate(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut dolor eros, lobortis ac orci a, molestie sagittis libero.',
        {
          debug: true,
        },
      ),
    ]).then(() => {
      const images = glob.sync(path.join(process.cwd(), '*.png'));
      // expect(images).to.have.lengthOf(2);
      const dimensions1 = sizeOf(images[0]);
      const dimensions2 = sizeOf(images[1]);
      expect(dimensions1.height).toBeGreaterThan(0);
      expect(dimensions1.height).toBeLessThan(dimensions2.height);
      expect(dimensions1.width).toEqual(dimensions2.width);
    }));

  it('should create a new lines when a \\n occurrs', () =>
    Promise.all([
      imageGenerator.generate('Hello world', {
        debug: true,
      }),
      imageGenerator.generate('Hello world\nhello again', {
        debug: true,
      }),
    ]).then(() => {
      const images = glob.sync(path.join(process.cwd(), '*.png'));
      // expect(images).to.have.lengthOf(2);
      const dimensions1 = sizeOf(images[0]);
      const dimensions2 = sizeOf(images[1]);
      expect(dimensions1.height).toBeGreaterThan(0);
      expect(dimensions1.height).toBeLessThan(dimensions2.height);
      expect(dimensions1.width).toEqual(dimensions2.width);
    }));

  it('should create a new lines when a multiple \\n occurrs', () =>
    Promise.all([
      imageGenerator.generate('Hello world\nhello again', {
        debug: true,
      }),
      imageGenerator.generate('Hello world\n\n\nhello again', {
        debug: true,
      }),
    ]).then(() => {
      const images = glob.sync(path.join(process.cwd(), '*.png'));
      // expect(images).to.have.lengthOf(2);
      const dimensions1 = sizeOf(images[0]);
      const dimensions2 = sizeOf(images[1]);
      expect(dimensions1.height).toBeGreaterThan(0);
      expect(dimensions1.height).toBeLessThan(dimensions2.height);
      expect(dimensions1.width).toEqual(dimensions2.width);
    }));

  it('should default to a 400 px wide image', () =>
    Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
      }),
    ]).then(() => {
      const images = glob.sync(path.join(process.cwd(), '*.png'));
      const dimensions = sizeOf(images[0]);
      expect(dimensions.width).toEqual(400);
    }));

  it('should be configurable to use another image width', () =>
    Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        maxWidth: 500,
      }),
    ]).then(() => {
      const images = glob.sync(path.join(process.cwd(), '*.png'));
      const dimensions = sizeOf(images[0]);
      expect(dimensions.width).toEqual(500);
    }));

  it('should default to a white background no transparency', () =>
    Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
      }),
    ])
      .then(() => {
        const images = glob.sync(path.join(process.cwd(), '*.png'));
        const imageData = fs.readFileSync(images[0]);

        return new Promise((resolve, reject) => {
          readimage(imageData, (err, image) => {
            if (err) {
              reject(err);
            } else {
              resolve(image);
            }
          });
        });
      })
      .then(image => {
        expect(image.frames.length).toEqual(1);
        expect(image.frames[0].data[0]).toEqual(0xff);
        expect(image.frames[0].data[1]).toEqual(0xff);
        expect(image.frames[0].data[2]).toEqual(0xff);
        expect(image.frames[0].data[3]).toEqual(0xff);
      }));

  it('should use the background color specified with no transparency', () =>
    Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        bgColor: '#001122',
      }),
    ])
      .then(() => {
        const images = glob.sync(path.join(process.cwd(), '*.png'));
        const imageData = fs.readFileSync(images[0]);

        return new Promise((resolve, reject) => {
          readimage(imageData, (err, image) => {
            if (err) {
              reject(err);
            } else {
              resolve(image);
            }
          });
        });
      })
      .then(image => {
        expect(image.frames.length).toEqual(1);
        expect(image.frames[0].data[0]).toEqual(0x00);
        expect(image.frames[0].data[1]).toEqual(0x11);
        expect(image.frames[0].data[2]).toEqual(0x22);
        expect(image.frames[0].data[3]).toEqual(0xff);
      }));

  it('should default to a black text color', () => {
    const WIDTH = 720;
    const HEIGHT = 220;

    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        maxWidth: WIDTH,
        fontSize: 100,
        lineHeight: 100,
      }),
    ])
      .then(() => {
        const images = glob.sync(path.join(process.cwd(), '*.png'));
        const dimensions = sizeOf(images[0]);
        expect(dimensions.width).toEqual(WIDTH);
        expect(dimensions.height).toEqual(HEIGHT);
        const imageData = fs.readFileSync(images[0]);

        return new Promise((resolve, reject) => {
          readimage(imageData, (err, image) => {
            if (err) {
              reject(err);
            } else {
              resolve(image);
            }
          });
        });
      })
      .then(image => {
        const map = extractColors(image);
        // GIMP reports 256 colors on this image
        expect(Object.keys(map).length).toBeGreaterThanOrEqual(2);
        expect(Object.keys(map).length).toBeLessThanOrEqual(256);
        expect(map['#000000']).toBeGreaterThan(10);
        expect(map['#ffffff']).toBeGreaterThan(100);
      });
  });

  it('should use the text color specified', () => {
    const WIDTH = 720;
    const HEIGHT = 220;

    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        maxWidth: WIDTH,
        fontSize: 100,
        lineHeight: 100,
        textColor: '#112233',
      }),
    ])
      .then(() => {
        const images = glob.sync(path.join(process.cwd(), '*.png'));
        const dimensions = sizeOf(images[0]);
        expect(dimensions.width).toEqual(WIDTH);
        expect(dimensions.height).toEqual(HEIGHT);
        const imageData = fs.readFileSync(images[0]);

        return new Promise((resolve, reject) => {
          readimage(imageData, (err, image) => {
            if (err) {
              reject(err);
            } else {
              resolve(image);
            }
          });
        });
      })
      .then(image => {
        const map = extractColors(image);
        // GIMP reports 256 colors on this image
        expect(Object.keys(map).length).toBeGreaterThanOrEqual(2);
        expect(Object.keys(map).length).toBeLessThanOrEqual(256);
        expect(map['#000000']).toBeUndefined();
        expect(map['#112233']).toBeGreaterThan(10);
        expect(map['#ffffff']).toBeGreaterThan(100);
      });
  });
});
