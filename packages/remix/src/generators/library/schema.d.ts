import { SupportedStyles } from '@nx/react';

export interface NxRemixGeneratorSchema {
  name: string;
  tags?: string;
  importPath?: string;
  js?: boolean;
  style: SupportedStyles;
}
