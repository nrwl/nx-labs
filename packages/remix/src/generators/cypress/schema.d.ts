import { type ProjectNameAndRootFormat } from '@nx/devkit/src/generators/project-name-and-root-utils';

export interface CypressGeneratorSchema {
  project: string;
  name: string;
  baseUrl?: string;
  directory?: string;
  projectNameAndRootFormat?: ProjectNameAndRootFormat;
  linter?: 'none' | 'eslint';
  js?: boolean;
  skipFormat?: boolean;
  setParserOptionsProject?: boolean;
}
