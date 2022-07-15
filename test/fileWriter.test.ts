import glob from 'glob';
import fs from 'fs';
import path from 'path';
import { generate, generateSync } from '../src/textToImage';
import fileWriter from '../src/extensions/fileWriter';

describe('fileWriter extension', () => {
  afterEach(async () => {
    // remove all pngs created by the fileWriter
    const pngs = glob.sync(path.join(process.cwd(), '*.png'));
    await Promise.all(pngs.map((item) => fs.promises.unlink(item)));
  });

  it('should not create a file if fileWriter is not used', async () => {
    await generate('Hello world');

    const files = glob.sync(path.join(process.cwd(), '*.png'));
    expect(files.length).toEqual(0);
  });

  it('should create a png file', async () => {
    await generate('Hello world', {}, (canvas) => {
      fileWriter(canvas);
    });

    const files = glob.sync(path.join(process.cwd(), '*.png'));
    expect(files.length).toEqual(1);
  });

  it('should work in sync mode', () => {
    generateSync('Hello world', {}, (canvas) => {
      fileWriter(canvas, {
        fileName: '1_sync_debug.png',
      });
    });

    const images = glob.sync(path.join(process.cwd(), '1_sync_debug.png'));
    expect(images.length).toBe(1);
  });

  it('should support custom filepaths in sync mode', async () => {
    const baseDir = path.join(process.cwd(), 'test', 'custom_path');
    const filePath = path.join(baseDir, 'to', '1_path_debug.png');
    generateSync('Hello world', {}, (canvas) => {
      fileWriter(canvas, {
        fileName: filePath,
      });
    });

    const images = glob.sync(filePath);
    expect(images.length).toBe(1);

    await fs.promises.rmdir(baseDir, {
      recursive: true,
      // force: true,
    });
  });

  it('should support custom filepaths in async mode', async () => {
    const baseDir = path.join(process.cwd(), 'test', 'custom_path');
    const filePath = path.join(baseDir, 'to', '1_path_debug.png');
    await generate('Hello world', {}, (canvas) => {
      fileWriter(canvas, {
        fileName: filePath,
      });
    });

    const images = glob.sync(filePath);
    expect(images.length).toBe(1);

    await fs.promises.rmdir(baseDir, {
      recursive: true,
    });
  });

  it('should support default filename in sync mode', () => {
    generateSync('Hello world', {}, (canvas) => {
      fileWriter(canvas);
    });

    const images = glob.sync(path.join(process.cwd(), '*.png'));
    expect(images.length).toBe(1);
  });
});
