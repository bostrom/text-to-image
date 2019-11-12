function paddedHex(intVal) {
  let s = intVal.toString(16);
  if (s.length === 1) {
    s = `0${s}`;
  }

  return s;
}

function extractColors(image) {
  const pixels = image.frames[0].data;
  const colorMap = {};
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // a = pixels[i + 3]

    const hexNotation = `#${paddedHex(r)}${paddedHex(g)}${paddedHex(b)}`;
    let currValue = colorMap[hexNotation];
    if (currValue) {
      currValue += 1;
    } else {
      currValue = 1;
    }
    colorMap[hexNotation] = currValue;
  }

  return colorMap;
}

module.exports = extractColors;
