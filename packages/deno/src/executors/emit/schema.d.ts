import type { AssetGlob } from '@nx/js/src/assets/assets';

export interface BuildExecutorSchema {
  denoConfig: string;
  main: string;
  outputFile: string;
  bundle?: boolean;
  assets?: Array<AssetGlob | string>;
}
