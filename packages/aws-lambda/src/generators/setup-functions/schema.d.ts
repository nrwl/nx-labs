import { Linter } from '@nx/linter';

export interface SetupFunctionsSchema {
  name: string;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  directory?: string;
  unitTestRunner?: 'jest' | 'none';
  linter?: Linter;
  tags?: string;
  buildTarget?: string;
  serveTarget?: string;
  deployTarget?: string;
}

export interface NormalizedSchema extends SetupFunctionsSchema {
  projectName: string;
}
