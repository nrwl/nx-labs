import { SupportedStyles } from '@nx/react';

export interface Schema {
  name: string;
  tags?: string;
  style: SupportedStyles;
  directory?: string;
  unitTestRunner?: 'jest' | 'none';
  e2eTestRunner?: 'cypress' | 'none';
  js?: boolean;
  setParserOptionsProject?: boolean;
  standaloneConfig?: boolean;
}
