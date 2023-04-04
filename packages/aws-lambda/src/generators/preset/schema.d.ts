export interface PresetGeneratorSchema {
  name: string;
  unitTestRunner?: 'none' | 'jest';
  directory?: string;
  tags?: string;
  lintTarget?: string;
  deployTarget?: string;
}

export interface NormalizedSchema extends PresetGeneratorSchema {
  appProjectRoot: string;
}
