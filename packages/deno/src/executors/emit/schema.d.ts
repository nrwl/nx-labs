export interface BuildExecutorSchema {
  denoConfig: string;
  main: string;
  outputFile: string;
  bundle?: boolean;
}
