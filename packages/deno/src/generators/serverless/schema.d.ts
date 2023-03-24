export interface ServerlessGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  platform?: 'netlify' | 'deno-deploy' | 'none';
  linter?: 'deno' | 'none';
  unitTestRunner?: 'deno' | 'none';
  site?: string;
}
