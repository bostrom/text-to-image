declare module 'readimage' {
  export interface Frame {
    data: number[];
    delay?: number;
  }
  export interface ReadimageData {
    height: number;
    width: number;
    frames: Frame[];
  }
  export default function readimage(
    buf: Buffer,
    cb: (err: Error | undefined, img: ReadimageData) => void,
  ): void;
}
