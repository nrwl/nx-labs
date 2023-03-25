import type { Mode } from '@rspack/core';
import type { DevServer } from '@rspack/core';

export interface DevServerExecutorSchema {
  buildTarget: string;
  mode?: Mode;
  port?: number;
  devServer?: DevServer;
}
