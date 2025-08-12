import { generate } from '../../textToImage';
import { readImageData, uriToBuf } from './readImageData';

describe('readImageData', () => {
  it('should reject if the data is not an image', async () => {
    await expect(readImageData('asdf' as unknown as Buffer)).rejects.toEqual(
      'SOI not found',
    );
  });
  it('should resolve with image data', async () => {
    const imguri = await generate('asdf');
    const imageData = await readImageData(uriToBuf(imguri));
    expect(imageData.width).toBeDefined();
  });
});
