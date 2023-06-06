export interface NxRemixGeneratorSchema {
  name: string;
  tags?: string;
  js?: boolean;
  directory?: string;
  unitTestRunner?: 'vitest' | 'jest' | 'none';
  e2eTestRunner?: 'cypress' | 'none';
  skipFormat?: boolean;
  rootProject?: boolean;
}
