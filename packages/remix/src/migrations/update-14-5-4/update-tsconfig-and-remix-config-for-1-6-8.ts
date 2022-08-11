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

  const remixProjectsWithDefaultPaths = remixProjects.filter((project) => {
    const tsConfigPath = joinPathFragments(project.root, 'tsconfig.json');
    const tsConfigContent = readJson(tree, tsConfigPath);

    return !!tsConfigContent.compilerOptions.paths['~/*'];
  });

  const updateTsConfigPaths = remixProjectsWithDefaultPaths.length === 1;

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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const newTsConfigContent = {
        ...tsConfigContent,
        extends: `${projectOffsetFromRoot}tsconfig.base.json`,
      };

      delete newTsConfigContent.compilerOptions.baseUrl;

      if (updateTsConfigPaths) {
        delete newTsConfigContent.compilerOptions.paths;

        const tsconfigBaseJsonPath = 'tsconfig.base.json';
        const tsConfigBaseJsonContent = readJson(tree, tsconfigBaseJsonPath);

        const newTsConfigBaseJsonContent = {
          ...tsConfigBaseJsonContent,
          compilerOptions: {
            ...tsConfigBaseJsonContent.compilerOptions,
            paths: {
              ...tsConfigBaseJsonContent.compilerOptions.paths,
              '~/*': [joinPathFragments(project.root, 'app', '*')],
            },
          },
        };

        writeJson(tree, tsconfigBaseJsonPath, newTsConfigBaseJsonContent);
      } else {
        logger.info(
          "You have more than one Remix app with the default path '~' configured, so it cannot be automatically migrated.\n\nManually assign new paths for these imports in `tsconfig.base.json` and then delete the `paths` property from the `tsconfig.app.json` in each app."
        );
      }

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
