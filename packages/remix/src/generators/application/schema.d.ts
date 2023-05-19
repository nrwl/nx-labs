export interface NxRemixGeneratorSchema {
  name: string;
  tags?: string;
  js?: boolean;
  directory?: string;
  skipFormat?: boolean;
  rootProject?: boolean;
}
