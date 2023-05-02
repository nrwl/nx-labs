import { getProjects, joinPathFragments, Tree } from '@nx/devkit';

export function getRemixProjects(tree: Tree) {
  const projects = getProjects(tree);

  const remixProjects = Array.from(projects.values()).filter((project) => {
    const remixConfigPath = joinPathFragments(project.root, 'remix.config.js');
    // if the project doesn't have a remix.config.js, it's not a Remix project so we can skip it
    return tree.exists(remixConfigPath);
  });
  return remixProjects;
}
