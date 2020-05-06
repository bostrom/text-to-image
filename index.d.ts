export interface GenerateOptions {
  maxWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'initial' | 'inherit';
  margin?: number;
  bgColor?: string;
  textColor?: string;
  customHeight?: number;
  debug?: boolean;
  debugFilename?: string;
}

export function generate(
  text: string,
  options?: GenerateOptions,
): Promise<string>;

export function generateSync(text: string, options?: GenerateOptions): string;
