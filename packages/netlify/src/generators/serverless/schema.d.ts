import { Linter } from '@nx/eslint';
export interface Schema {
  name: string;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  directory?: string;
  unitTestRunner?: 'jest' | 'none';
  linter?: Linter;
  tags?: string;
  lintTarget?: string;
  buildTarget?: string;
  deployTarget?: string;
  site?: string;
}
