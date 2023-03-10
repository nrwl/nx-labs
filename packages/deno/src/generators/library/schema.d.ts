export interface LibraryGeneratorSchema {
  name: string;
  tags?: string;
  directory?: string;
  unitTestRunner?: 'deno' | 'none';
  linter?: 'deno' | 'none';
  addNodeEntrypoint?: boolean;
  importPath?: string;
}
