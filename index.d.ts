export interface GenerateOptions {
  bgColor?: string;
  customHeight?: number;
  debug?: boolean;
  debugFilename?: string;
  fontFamily?: string;
  fontPath?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  margin?: number;
  maxWidth?: number;
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'initial' | 'inherit';
  textColor?: string;
  verticalAlign?: 'top' | 'center';
}

export function generate(
  text: string,
  options?: GenerateOptions,
): Promise<string>;

export function generateSync(text: string, options?: GenerateOptions): string;
