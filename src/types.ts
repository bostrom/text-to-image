import { Canvas } from 'canvas';

export type GenerateFunction = (
  content: string,
  config?: GenerateOptions,
  callback?: GenerateCallback,
) => string | Promise<string>;

export type GenerateCallback = (
  canvas: Canvas,
) => void | undefined | Promise<void | undefined>;

export interface GenerateOptions {
  bgColor?: string | CanvasGradient | CanvasPattern;
  customHeight?: number;
  bubbleTail?: { width: number; height: number };
  fontFamily?: string;
  fontPath?: string;
  fontSize?: number;
  fontWeight?: string | number;
  lineHeight?: number;
  margin?: number;
  maxWidth?: number;
  textAlign?: CanvasTextAlign;
  textColor?: string;
  verticalAlign?: string;
}

export type GenerateOptionsRequired = Required<GenerateOptions>;

export interface fileWriterOptions {
  fileName?: string;
}
