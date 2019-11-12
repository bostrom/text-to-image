const readImageData = require('./readImageData');

describe('readImageData', () => {
  it('should reject if the data is not an image', async () => {
    await expect(readImageData('asdf')).rejects.toEqual('SOI not found');
  });
});
