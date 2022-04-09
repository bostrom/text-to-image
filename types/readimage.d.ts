declare module 'readimage' {
  export type Frame = {
    data: number[];
    delay?: number;
  };
  export interface ReadimageData {
    height: number;
    width: number;
    frames: Frame[];
  }
  export default function readimage(
    buf: Buffer,
    cb: (err: Error, img: ReadimageData) => void,
  ): void;
}
