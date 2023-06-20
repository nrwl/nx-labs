import { Linter } from '@nx/linter';

export interface StorybookConfigurationSchema {
  name: string;
  configureCypress: boolean;
  generateStories?: boolean;
  generateCypressSpecs?: boolean;
  js?: boolean;
  tsConfiguration?: boolean;
  linter?: Linter;
  cypressDirectory?: string;
  ignorePaths?: string[];
  configureTestRunner?: boolean;
  configureStaticServe?: boolean;
}
