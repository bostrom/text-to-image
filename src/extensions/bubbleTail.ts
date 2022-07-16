import { createCanvas, Canvas } from 'canvas';
import { ComputedOptions } from '../types';

export interface BubbleTailOptions {
  width: number;
  height: number;
}

export default ({ width, height }: BubbleTailOptions) =>
  (canvas: Canvas, conf: ComputedOptions) => {
    if (width <= 0 || height <= 0) {
      return canvas;
    }

    // create a new bigger canvas to accommodate the tail
    const tailedCanvas = createCanvas(canvas.width, canvas.height + height);
    const tailedCtx = tailedCanvas.getContext('2d');

    // copy the original image onto the new canvas
    tailedCtx.drawImage(canvas, 0, 0);

    // draw the tail
    tailedCtx.beginPath();
    tailedCtx.moveTo(
      tailedCanvas.width / 2 - width / 2,
      tailedCanvas.height - height,
    );
    tailedCtx.lineTo(tailedCanvas.width / 2, tailedCanvas.height);
    tailedCtx.lineTo(
      tailedCanvas.width / 2 + width / 2,
      tailedCanvas.height - height,
    );
    tailedCtx.closePath();
    tailedCtx.fillStyle = conf.bgColor;
    tailedCtx.fill();

    return tailedCanvas;
  };
