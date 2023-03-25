import type { DevServer, Mode } from '@rspack/core';

export interface DevServerExecutorSchema {
  buildTarget: string;
  mode?: Mode;
  port?: number;
  devServer?: DevServer;
}
