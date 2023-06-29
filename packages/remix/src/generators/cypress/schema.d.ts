export interface CypressGeneratorSchema {
  project: string;
  name: string;
  baseUrl?: string;
  directory?: string;
  linter?: 'none' | 'eslint';
  js?: boolean;
  skipFormat?: boolean;
  setParserOptionsProject?: boolean;
}
