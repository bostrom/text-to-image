const readimage = require('readimage');

const uriToBuf = (imageUri) => Buffer.from(imageUri.split(',')[1], 'base64');

const readImageData = (imageData) =>
  new Promise((resolve, reject) => {
    readimage(imageData, (err, img) => {
      if (err) {
        reject(err);
      } else {
        resolve(img);
      }
    });
  });

const countWhitePixels = (imageData, fromCol, fromRow, toCol, toRow) =>
  imageData.frames[0].data.reduce(
    (acc, cur, index) =>
      // each pixel has 4 values (RGBA), skip every 4th value (i.e. the alpha)
      (index + 1) % 4 !== 0 &&
      // only include values for pixels within the ranges
      (index / 4) % imageData.width >= fromCol &&
      (index / 4) % imageData.width < toCol &&
      index / 4 / imageData.width >= fromRow &&
      index / 4 / imageData.width < toRow
        ? acc + cur / 255
        : acc,
    0,
  ) / 3;

module.exports = {
  uriToBuf,
  readImageData,
  countWhitePixels,
};
