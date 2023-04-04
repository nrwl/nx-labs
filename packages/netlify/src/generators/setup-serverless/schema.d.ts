export interface SetupServerlessFunctionOptions {
  project?: string;
  buildTarget?: string;
  lintTarget?: string;
  deployTarget?: string;
  serveTarget?: string;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  site?: string;
}
