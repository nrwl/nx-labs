import { type TargetConfiguration } from '@nx/devkit';

export interface ComposerJson {
  name: string;
  description?: string;
  type?: string;
  require?: Record<string, string>;
  'require-dev'?: Record<string, string>;
  autoload?: Record<string, unknown>;
  'autoload-dev'?: Record<string, unknown>;
  scripts?: Record<string, string | string[]>;
  'scripts-descriptions'?: Record<string, string>;
  extra?: {
    nx?: {
      targets?: Record<string, TargetConfiguration>;
    };
  };
}
