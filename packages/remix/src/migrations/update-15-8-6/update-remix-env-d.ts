import { joinPathFragments, logger, Tree } from '@nx/devkit';
import { getRemixProjects } from '../../utils/get-remix-projects';

/**
 * Update remix.env.d.ts
 * @param tree
 */
export default async function update(tree: Tree) {
  const remixProjects = getRemixProjects(tree);

  remixProjects.forEach((project) => {
    const remixEnvPath = joinPathFragments(project.root, 'remix.env.d.ts');

    try {
      const remixEnvContent = tree.read(remixEnvPath, 'utf-8');

      tree.write(
        remixEnvPath,
        remixEnvContent.replace(
          '/// <reference types="@remix-run/node/globals" />',
          '/// <reference types="@remix-run/node" />'
        )
      );
    } catch (err) {
      logger.error(err);
      logger.error(
        `Unable to update ${remixEnvPath} for project ${project.root}.`
      );
    }
  });
}
