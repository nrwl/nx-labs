import type { AssetGlob, FileInputOutput } from '../../assets/assets';

export interface BuildExecutorSchema {
  denoConfig: string;
  main: string;
  outputFile: string;
  bundle?: boolean;
  assets?: Array<AssetGlob | string>;
}
