import { CSS_IN_JS_DEPENDENCIES } from '@nrwl/react';
import {
  gatsbyPluginEmotionVersion,
  gatsbyPluginLessVersion,
  gatsbyPluginSassVersion,
  gatsbyPluginStyledComponentsVersion,
  gatsbyPluginStyledJsx,
  gatsbyPluginStylusVersion,
  sassVersion,
} from './versions';
import { Tree } from '@nrwl/tao/src/shared/tree';
import { addDependenciesToPackageJson, GeneratorCallback } from '@nrwl/devkit';

export const GATSBY_SPECIFIC_STYLE_DEPENDENCIES = {
  'styled-components': {
    dependencies: CSS_IN_JS_DEPENDENCIES['styled-components'].dependencies,
    devDependencies: {
      'gatsby-plugin-styled-components': gatsbyPluginStyledComponentsVersion,
    },
  },
  '@emotion/styled': {
    dependencies: CSS_IN_JS_DEPENDENCIES['@emotion/styled'].dependencies,
    devDependencies: {
      'gatsby-plugin-emotion': gatsbyPluginEmotionVersion,
    },
  },
  scss: {
    dependencies: {},
    devDependencies: {
      sass: sassVersion,
      'gatsby-plugin-sass': gatsbyPluginSassVersion,
    },
  },
  less: {
    dependencies: {},
    devDependencies: {
      'gatsby-plugin-less': gatsbyPluginLessVersion,
    },
  },
  styl: {
    dependencies: {},
    devDependencies: {
      'gatsby-plugin-stylus': gatsbyPluginStylusVersion,
    },
  },
  'styled-jsx': {
    dependencies: CSS_IN_JS_DEPENDENCIES['styled-jsx'].dependencies,
    devDependencies: {
      'gatsby-plugin-styled-jsx': gatsbyPluginStyledJsx,
      ...CSS_IN_JS_DEPENDENCIES['styled-jsx'].devDependencies,
    },
  },
};

export function addStyleDependencies(host: Tree, style: string) {
  let installTask: GeneratorCallback;

  const extraDependencies = GATSBY_SPECIFIC_STYLE_DEPENDENCIES[style];

  if (!extraDependencies) return () => {};

  installTask = addDependenciesToPackageJson(
    host,
    extraDependencies.dependencies,
    extraDependencies.devDependencies
  );

  return installTask;
}
