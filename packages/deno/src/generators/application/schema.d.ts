export interface ApplicationGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  unitTestRunner?: 'deno' | 'none';
  linter?: 'deno' | 'none';
  withWatch?: boolean;
}
