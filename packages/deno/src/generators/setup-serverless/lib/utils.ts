import { ProjectConfiguration, stripIndents } from '@nrwl/devkit';

export function assertNoTarget(
  projectConfig: ProjectConfiguration,
  target: string
) {
  if (projectConfig?.targets?.[target]) {
    throw new Error(stripIndents`Project, ${projectConfig.name}, already has a ${target} target defined.
Either rename this target or remove it from the project configuration.`);
  }
}
