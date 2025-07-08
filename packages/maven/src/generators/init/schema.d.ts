export interface InitGeneratorSchema {
  /**
   * Skip formatting files
   */
  skipFormat?: boolean;

  /**
   * Don't add dependencies to package.json
   */
  skipPackageJson?: boolean;

  /**
   * Keep existing dependency versions
   */
  keepExistingVersions?: boolean;

  /**
   * Update package.json scripts with inferred targets
   */
  updatePackageScripts?: boolean;

  /**
   * Path to Maven executable
   */
  mavenExecutable?: string;
}
