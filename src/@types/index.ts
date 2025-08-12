import { Canvas, CanvasGradient, CanvasPattern, CanvasTextAlign } from 'canvas';

export type * from 'canvas';

export type GenerateFunction<T extends GenerateOptions> = (
  content: string,
  config?: T,
) => Promise<string>;

export type GenerateFunctionSync<T extends GenerateOptionsSync> = (
  content: string,
  config?: T,
) => string;

export interface GenerateOptions {
  bgColor?: string | CanvasGradient | CanvasPattern;
  customHeight?: number;
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
  extensions?: Extension[];
}

export interface GenerateOptionsAsync extends GenerateOptions {
  extensions?: Extension[];
}

export interface GenerateOptionsSync extends GenerateOptions {
  extensions?: SyncExtension[];
}

export type SyncExtension = (canvas: Canvas, config: ComputedOptions) => Canvas;

export type AsyncExtension = (
  canvas: Canvas,
  config: ComputedOptions,
) => Promise<Canvas>;

export type Extension = SyncExtension | AsyncExtension;

export type ComputedOptions<T extends GenerateOptions = GenerateOptions> =
  Required<T>;

export interface fileWriterOptions {
  fileName?: string;
}
