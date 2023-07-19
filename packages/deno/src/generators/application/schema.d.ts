export interface DenoAppGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  unitTestRunner?: 'deno' | 'none';
  linter?: 'deno' | 'none';
  withWatch?: boolean;
  denoDeploy?: boolean;
  monorepo?: boolean;
  rootProject?: boolean;
  framework?: 'oak' | 'none';
  bundler?: 'esbuild' | 'deno_emit';
}

export interface DenoAppNormalizedSchema extends DenoAppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}
