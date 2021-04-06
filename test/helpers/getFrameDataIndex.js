function getFrameDataIndex(width, column, row, substract = false) {
  if (substract) {
    return width * column * 4 - row * 4;
  }

  return width * column * 4 + row * 4;
}

module.exports = getFrameDataIndex;
