const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  const rules = config.module.rules[1]?.oneOf;
  if (rules) {
    rules.push({
      test: /\.(mjs|[jt]sx?)$/,
      exclude: /node_modules/,
      use: {
        loader: require.resolve('@nrwl/web/src/utils/web-babel-loader.js'),
        options: {
          presets: [
            [
              '@nrwl/react/babel',
              {
                runtime: 'automatic',
              },
            ],
          ],
        },
      },
    });
    // svg rule from https://github.com/kristerkari/react-native-svg-transformer/issues/135#issuecomment-1008310514
    rules.unshift({
      test: /\.svg$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('@svgr/webpack'),
          options: {
            svgoConfig: {
              plugins: [
                { name: 'removeDoctype', active: true },
                { name: 'removeXMLProcInst', active: true },
                { name: 'removeComments', active: true },
                { name: 'removeMetadata', active: true },
                { name: 'removeXMLNS', active: true },
                { name: 'removeEditorsNSData', active: true },
                { name: 'cleanupAttrs', active: true },
                { name: 'inlineStyles', active: true },
                { name: 'minifyStyles', active: true },
                { name: 'convertStyleToAttrs', active: true },
                { name: 'cleanupIDs', active: true },
                { name: 'removeRasterImages', active: true },
                { name: 'removeUselessDefs', active: true },
                { name: 'cleanupNumericValues', active: true },
                { name: 'cleanupListOfValues', active: true },
                { name: 'convertColors', active: true },
                { name: 'removeUnknownsAndDefaults', active: true },
                { name: 'removeNonInheritableGroupAttrs', active: true },
                { name: 'removeUselessStrokeAndFill', active: true },
                { name: 'removeViewBox', active: false },
                { name: 'cleanupEnableBackground', active: true },
                { name: 'removeHiddenElems', active: true },
                { name: 'removeEmptyText', active: true },
                { name: 'convertShapeToPath', active: true },
                { name: 'moveElemsAttrsToGroup', active: true },
                { name: 'moveGroupAttrsToElems', active: true },
                { name: 'collapseGroups', active: true },
                { name: 'convertPathData', active: true },
                { name: 'convertEllipseToCircle', active: true },
                { name: 'convertTransform', active: true },
                { name: 'removeEmptyAttrs', active: true },
                { name: 'removeEmptyContainers', active: true },
                { name: 'mergePaths', active: true },
                { name: 'removeUnusedNS', active: true },
                { name: 'reusePaths', active: true },
                { name: 'sortAttrs', active: true },
                { name: 'sortDefsChildren', active: true },
                { name: 'removeTitle', active: true },
                { name: 'removeDesc', active: true },
                { name: 'removeDimensions', active: false },
                { name: 'removeStyleElement', active: false },
                { name: 'removeScriptElement', active: false },
              ],
            },
            inlineStyles: {
              onlyMatchedOnce: false,
            },
            removeDimensions: false,
            removeUnknownsAndDefaults: false,
            convertColors: false,
          },
        },
      ],
    });
  }

  const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];
  let tsConfigPath = 'tsconfig.json';

  config.resolve.plugins.push(
    new TsconfigPathsPlugin({
      configFile: tsConfigPath,
      extensions,
    })
  );
  return config;
};
