export interface ComposerJson {
  name: string;
  description?: string;
  type?: string;
  require?: Record<string, string>;
  'require-dev'?: Record<string, string>;
  autoload?: Record<string, unknown>;
  'autoload-dev'?: Record<string, unknown>;
  scripts?: Record<string, string | string[]>;
  'scripts-descriptions'?: Record<string, string>;
}

export interface ComposerLock {
  _readme: string[];
  'content-hash': string;
  packages: Package[];
  'packages-dev': Package[];
  aliases: any[];
  'minimum-stability': string;
  'stability-flags': Record<string, number>;
  'prefer-stable': boolean;
  'prefer-lowest': boolean;
  platform: Record<string, string>;
  'platform-dev': Record<string, string>;
  'plugin-api-version': string;
}

export interface Package {
  name: string;
  version: string;
  source: Source;
  dist: Dist;
  require?: Record<string, string>;
  'require-dev'?: Record<string, string>;
  suggest?: Record<string, string>;
  type: string;
  extra?: Record<string, any>;
  autoload?: Autoload;
  'autoload-dev'?: Autoload;
  license?: string | string[];
  description?: string;
  keywords?: string[];
  time?: string;
  bin?: string[];
  scripts?: Record<string, string | string[]>;
  homepage?: string;
  abandoned?: boolean | string;
  conflict?: Record<string, string>;
  provide?: Record<string, string>;
  replace?: Record<string, string>;
}

export interface Source {
  type: string;
  url: string;
  reference: string;
  shasum?: string;
}

export interface Dist {
  type: string;
  url: string;
  reference: string;
  shasum: string;
  mirrors?: string[];
}

export interface Autoload {
  'psr-4'?: Record<string, string | string[]>;
  'psr-0'?: Record<string, string | string[]>;
  classmap?: string[];
  files?: string[];
  'exclude-from-classmap'?: string[];
}
