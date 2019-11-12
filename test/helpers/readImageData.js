const readimage = require('readimage');

const readImageData = imageData =>
  new Promise((resolve, reject) => {
    readimage(imageData, (err, img) => {
      if (err) {
        reject(err);
      } else {
        resolve(img);
      }
    });
  });

module.exports = readImageData;
