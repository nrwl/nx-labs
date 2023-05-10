import { SupportedStyles } from '@nx/react';

export interface NxRemixGeneratorSchema {
  name: string;
  style: SupportedStyles;
  directory?: string;
  tags?: string;
  importPath?: string;
  buildable?: boolean;
  js?: boolean;
  skipFormat?: boolean;
}
