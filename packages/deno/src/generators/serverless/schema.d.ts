export interface ServerlessGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  platform?: 'netlify' | 'none';
  linter?: 'deno' | 'none';
  unitTestRunner?: 'deno' | 'none';
  site?: string;
}
