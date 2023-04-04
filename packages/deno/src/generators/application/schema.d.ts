export interface DenoAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  unitTestRunner?: 'deno' | 'none';
  linter?: 'deno' | 'none';
  withWatch?: boolean;
  monorepo?: boolean;
  rootProject?: boolean;
  framework?: 'oak' | 'none';
}

export interface DenoAppNormalizedSchema extends DenoAppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}
