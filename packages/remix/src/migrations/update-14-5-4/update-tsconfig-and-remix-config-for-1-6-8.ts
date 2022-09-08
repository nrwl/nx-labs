import {
  formatFiles,
  getProjects,
  getWorkspaceLayout,
  joinPathFragments,
  logger,
  offsetFromRoot,
  readJson,
  Tree,
  writeJson,
} from '@nrwl/devkit';

/**
 * Update tsconfig.json and remix.config.js to support importing workspaces libraries
 * @param tree
 */
export default async function update(tree: Tree) {
  const projects = getProjects(tree);

  const remixProjects = Array.from(projects.values()).filter((project) => {
    const remixConfigPath = joinPathFragments(project.root, 'remix.config.js');
    // if the project doesn't have a remix.config.js, it's not a Remix project so we can skip it
    return tree.exists(remixConfigPath);
  });

  if (remixProjects.length === 0) return;

  remixProjects.forEach((project) => {
    const remixConfigPath = joinPathFragments(project.root, 'remix.config.js');

    try {
      const remixConfigContent = tree.read(remixConfigPath, 'utf-8');
      // if watchPaths is already there, we assume this project has been updated before
      if (remixConfigContent.includes('watchPaths')) return;

      const projectOffsetFromRoot = offsetFromRoot(project.root);
      const layout = getWorkspaceLayout(tree);
      tree.write(
        remixConfigPath,
        remixConfigContent.replace(
          'module.exports = {\n',
          `module.exports = {  watchPaths: ['${joinPathFragments(
            projectOffsetFromRoot,
            layout.libsDir
          )}'],\n`
        )
      );

      const tsConfigPath = joinPathFragments(project.root, 'tsconfig.json');
      const tsConfigContent = readJson(tree, tsConfigPath);

      const newTsConfigContent = {
        ...tsConfigContent,
        extends: `${projectOffsetFromRoot}tsconfig.base.json`,
      };

      delete newTsConfigContent.compilerOptions.baseUrl;

      logger.info(
        `Remix apps now support importing from non-buildable libs. However, you must remove the \`paths\` configuration from the project's \`tsconfig.json\`.\n\nMigrate any import paths using \`~\` to relative path imports and then delete the \`paths\` property from \`${tsConfigPath}\``
      );

      writeJson(tree, tsConfigPath, newTsConfigContent);
    } catch (err) {
      logger.error(err);
      logger.error(
        `Unable to update ${remixConfigPath} for project ${project.root}.`
      );
    }
  });
  await formatFiles(tree);
}
