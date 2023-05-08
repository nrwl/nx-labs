export interface SetupFunctionsSchema {
  project?: string;
  deployTarget?: string;
  serveTarget?: string;
  skipFormat?: boolean;
  skipPackageJson?: boolean;
  site?: string;
}
