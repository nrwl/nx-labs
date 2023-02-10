import { DenoTypeCheck } from '../../utils/arg-utils';

export interface DenoTestExecutorSchema {
  denoConfig: string;
  watch?: boolean;
  coverageDirectory?: string;
  check?: DenoTypeCheck;
  doc?: boolean;
  cert?: string;
  failFast?: boolean | number;
  filter?: string;
  ignore?: string[];
  inspect?: string;
  location?: string;
  parallel?: boolean | number;
  quiet?: boolean | string;
  reload?: string;
  seed?: number;
  shuffle?: number;
  unstable?: boolean;
}
