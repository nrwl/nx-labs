export interface LintExecutorSchema {
  denoConfig: string;
  compact?: boolean;
  ignore?: string;
  json?: boolean;
  quiet?: boolean;
  rulesExclude?: string;
  rulesInclude?: string;
  rulesTags?: string;
  unstable?: boolean;
  watch?: boolean;
}
