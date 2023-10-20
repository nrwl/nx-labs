import { readNxJson, Tree, updateNxJson } from '@nx/devkit';

import { NormalizedSchema } from './normalize-options';

export function setDefaults(host: Tree, options: NormalizedSchema) {
  const workspace = readNxJson(host);

  if (!workspace.defaultProject) {
    workspace.defaultProject = options.projectName;
  }

  workspace.generators = workspace.generators || {};
  workspace.generators['@nx/gatsby'] = workspace.generators['@nx/gatsby'] || {};
  const prev = workspace.generators['@nx/gatsby'];

  workspace.generators = {
    ...workspace.generators,
    '@nx/gatsby': {
      ...prev,
      application: {
        style: options.style,
        ...prev.application,
      },
    },
  };

  updateNxJson(host, workspace);
}
