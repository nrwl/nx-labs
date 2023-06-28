export interface BuildExecutorSchema {
  denoConfig: string;
  main: string;
  outputFile: string;
  bundle?: boolean;
  sourceMap?: false | 'linked' | 'inline';
}
