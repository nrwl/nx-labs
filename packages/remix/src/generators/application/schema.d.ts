export interface NxRemixGeneratorSchema {
  name: string;
  tags?: string;
  js?: boolean;
  directory?: string;
  unitTestRunner?: 'vitest' | 'none';
  skipFormat?: boolean;
  rootProject?: boolean;
}
