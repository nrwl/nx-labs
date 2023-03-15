export interface DenoSetupServerlessSchema {
  project: string;
  platform: 'deno-deploy' | 'netlify' | 'none';
}
