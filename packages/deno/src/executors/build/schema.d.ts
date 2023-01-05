import { DenoTypeCheck } from '../../utils/schema-types';

export interface BuildExecutorSchema {
  denoConfig: string;
  main: string;
  outputFile: string;
  cert?: string;
  check?: DenoTypeCheck;
  lockWrite?: boolean;
  noLock?: boolean;
  noNpm?: boolean;
  noRemote?: boolean;
  nodeModulesDir?: string;
  reload?: boolean | string;
  quiet?: boolean;
  unstable?: boolean;
  watch?: boolean;
}
