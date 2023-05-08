export interface DenoSetupServerlessSchema {
  project: string;
  platform: 'netlify' | 'none';
  site?: string;
  deployTarget?: string;
  serveTarget?: string;
}
