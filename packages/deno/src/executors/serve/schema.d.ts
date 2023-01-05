import { DenoTypeCheck } from '../../utils/schema-types';

export interface ServeExecutorSchema {
  buildTarget: string;
  main?: string;
  denoConfig?: string;
  cert?: string;
  check?: DenoTypeCheck;
  inspect?: boolean | string;
  location?: string;
  lockWrite?: boolean;
  noLock?: boolean;
  noNpm?: boolean;
  noRemote?: boolean;
  nodeModulesDir?: string;
  quiet?: boolean;
  reload?: boolean | string;
  seed?: string;
  unstable?: boolean;
  watch?: boolean;
}
