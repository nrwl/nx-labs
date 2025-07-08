// Export the main Maven plugin
export {
  MavenPluginOptions,
  createDependencies,
  createNodesV2,
  default,
} from './plugin/maven-plugin';

// Export generators
export { default as initGenerator } from './generators/init';
