import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { Canvas } from 'canvas';
import { fileWriterOptions } from '../@types';

export default (options?: fileWriterOptions) => (canvas: Canvas) => {
  const fileName =
    options?.fileName ??
    `${new Date().toISOString().replace(/[\W.]/g, '')}.png`;

  mkdirSync(resolve(dirname(fileName)), { recursive: true });
  writeFileSync(fileName, canvas.toBuffer());

  return canvas;
};
