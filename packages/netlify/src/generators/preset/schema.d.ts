export interface PresetGeneratorSchema {
  name: string;
  unitTestRunner?: 'none' | 'jest';
  directory?: string;
  tags?: string;
  lintTarget?: string;
  buildTarget?: string;
  deployTarget?: string;
  site?: string;
}

export interface NormalizedSchema extends PresetGeneratorSchema {
  appProjectRoot: string;
}
