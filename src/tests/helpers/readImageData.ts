import readimage, { ReadimageData } from 'readimage';

export const uriToBuf = (imageUri: string) =>
  Buffer.from(imageUri.split(',')[1], 'base64');

export const readImageData = (imageData: Buffer) =>
  new Promise<ReadimageData>((resolve, reject) => {
    readimage(imageData, (err, img) => {
      if (err) {
        reject(err);
      } else {
        resolve(img);
      }
    });
  });

export const countWhitePixels = (
  imageData: ReadimageData,
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
) =>
  imageData.frames[0].data.reduce((acc, cur, index) => {
    const alpha = (index + 1) % 4 === 0;
    const col = (index / 4) % imageData.width;
    const row = index / 4 / imageData.width;

    // each pixel has 4 values (RGBA), skip every 4th value (i.e. the alpha)
    return !alpha &&
      // only include values for pixels within the ranges
      col >= fromCol &&
      col < toCol &&
      row >= fromRow &&
      row < toRow
      ? acc + cur / 255
      : acc;
  }, 0) / 3;

module.exports = {
  uriToBuf,
  readImageData,
  countWhitePixels,
};
