import { NameAndDirectoryFormat } from '@nx/devkit/src/generators/artifact-name-and-directory-utils';

export interface MetaSchema {
  path: string;
  nameAndDirectoryFormat?: NameAndDirectoryFormat;
  version?: '1' | '2';
  /**
   * @deprecated Provide the `path` option instead. The project will be determined from the path provided. It will be removed in Nx v18.
   */
  project?: string;
}
