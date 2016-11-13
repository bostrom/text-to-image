'use strict';

describe("the text-to-image generator", function () {

  var
    imageGenerator,
    Promise = require('bluebird'),
    glob = require('glob'),
    fs = require('fs'),
    path = require('path'),
    sizeOf = require('image-size'),
    readimage = require('readimage'),
    extractColors = require('./helpers/extractColors');

  beforeEach(function () {
    imageGenerator = require('../lib/text-to-image');
  });

  afterEach(function () {
    // remove all pngs created by the lib in debug mode
    var pngs = glob.sync(path.join(process.cwd(), '*.png'));
    pngs.forEach(function (item, index, array) {
      fs.unlinkSync(item);
    });
    delete process.env.DEBUG;
  });

  it("should expose a generate function", function () {
    imageGenerator.should.respondTo('generate');
  });

  it("should return a promise", function () {
    expect(imageGenerator.generate('Hello world')).to.respondTo('then');
  });

  it("should generate an image data url", function () {
    return imageGenerator.generate('Hello world').should.eventually.match(/^data:image\/png;base64/);
  });

  it("should create a png file in debug mode", function () {
    return imageGenerator.generate('Hello world', {
      debug: true
    }).then(function () {
      expect(glob.sync(path.join(process.cwd(), '*.png'))).to.have.lengthOf(1);
    });
  });

  it("should not create a file if not in debug mode", function () {
    return imageGenerator.generate('Hello world').then(function () {
      expect(glob.sync(path.join(process.cwd(), '*.png'))).to.have.lengthOf(0);
    });
  });

  it("should generate equal width but longer png when there's plenty of text", function () {
    return Promise.all([
      imageGenerator.generate('Hello world', {
        debug: true
      }),
      imageGenerator.generate('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut dolor eros, lobortis ac orci a, molestie sagittis libero.', {
        debug: true
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      // expect(images).to.have.lengthOf(2);
      var dimensions1 = sizeOf(images[0]);
      var dimensions2 = sizeOf(images[1]);
      expect(dimensions1.height).to.be.above(0);
      expect(dimensions1.height).to.be.below(dimensions2.height);
      expect(dimensions1.width).to.equal(dimensions2.width);
    });
  });

  it("should default to a 400 px wide image", function () {
    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      var dimensions = sizeOf(images[0]);
      expect(dimensions.width).to.equal(400);
    });
  });

  it("should be configurable to use another image width", function () {
    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        maxWidth: 500
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      var dimensions = sizeOf(images[0]);
      expect(dimensions.width).to.equal(500);
    });
  });

  it("should default to a white background no transparency", function () {
    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      var imageData = fs.readFileSync(images[0]);

      return new Promise(function (resolve, reject) {
        readimage(imageData, function (err, image) {
          if (err) {
            reject(err);
          } else {
            resolve(image);
          }
        });
      });
    }).then(function (image) {
      expect(image.frames.length).to.equal(1);
      expect(image.frames[0].data[0]).to.equals(0xff);
      expect(image.frames[0].data[1]).to.equals(0xff);
      expect(image.frames[0].data[2]).to.equals(0xff);
      expect(image.frames[0].data[3]).to.equals(0xff);
    });
  });

  it("should use the background color specified with no transparency", function () {
    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        bgColor: '#001122'
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      var imageData = fs.readFileSync(images[0]);

      return new Promise(function (resolve, reject) {
        readimage(imageData, function (err, image) {
          if (err) {
            reject(err);
          } else {
            resolve(image);
          }
        });
      });
    }).then(function (image) {
      expect(image.frames.length).to.equal(1);
      expect(image.frames[0].data[0]).to.equals(0x00);
      expect(image.frames[0].data[1]).to.equals(0x11);
      expect(image.frames[0].data[2]).to.equals(0x22);
      expect(image.frames[0].data[3]).to.equals(0xff);
    });
  });

  it("should default to a black text color", function () {
    var WIDTH = 720;
    var HEIGHT = 220;

    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        maxWidth: WIDTH,
        fontSize: 100,
        lineHeight: 100
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      var dimensions = sizeOf(images[0]);
      expect(dimensions.width).to.equals(WIDTH);
      expect(dimensions.height).to.equals(HEIGHT);
      var imageData = fs.readFileSync(images[0]);

      return new Promise(function (resolve, reject) {
        readimage(imageData, function (err, image) {
          if (err) {
            reject(err);
          } else {
            resolve(image);
          }
        });
      });
    }).then(function (image) {
      var map = extractColors(image);
      // GIMP reports 256 colors on this image
      expect(Object.keys(map).length).to.be.within(2, 256);
      expect(map['#000000']).to.be.above(10);
      expect(map['#ffffff']).to.be.above(100);
    });
  });

  it("should use the text color specified", function () {
    var WIDTH = 720;
    var HEIGHT = 220;

    return Promise.all([
      imageGenerator.generate('Lorem ipsum dolor sit amet.', {
        debug: true,
        maxWidth: WIDTH,
        fontSize: 100,
        lineHeight: 100,
        textColor: "#112233"
      })
    ]).then(function () {
      var images = glob.sync(path.join(process.cwd(), '*.png'));
      var dimensions = sizeOf(images[0]);
      expect(dimensions.width).to.equals(WIDTH);
      expect(dimensions.height).to.equals(HEIGHT);
      var imageData = fs.readFileSync(images[0]);

      return new Promise(function (resolve, reject) {
        readimage(imageData, function (err, image) {
          if (err) {
            reject(err);
          } else {
            resolve(image);
          }
        });
      });
    }).then(function (image) {
      var map = extractColors(image);
      // GIMP reports 256 colors on this image
      expect(Object.keys(map).length).to.be.within(2, 256);
      expect(map['#112233']).to.be.above(10);
      expect(map['#ffffff']).to.be.above(100);
    });
  });

});
