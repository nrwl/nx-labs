import { Linter } from '@nrwl/linter';

export interface Schema {
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
