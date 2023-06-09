import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  Tree,
} from '@nx/devkit';
import { cssInJsDependenciesBabel } from '@nx/react';
import {
  gatsbyPluginEmotionVersion,
  gatsbyPluginLessVersion,
  gatsbyPluginSassVersion,
  gatsbyPluginStyledComponentsVersion,
  gatsbyPluginStyledJsx,
  gatsbyPluginStylusVersion,
  sassVersion,
} from './versions';

export const GATSBY_SPECIFIC_STYLE_DEPENDENCIES = {
  'styled-components': {
    dependencies: cssInJsDependenciesBabel['styled-components'].dependencies,
    devDependencies: {
      'gatsby-plugin-styled-components': gatsbyPluginStyledComponentsVersion,
    },
  },
  '@emotion/styled': {
    dependencies: cssInJsDependenciesBabel['@emotion/styled'].dependencies,
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
    dependencies: cssInJsDependenciesBabel['styled-jsx'].dependencies,
    devDependencies: {
      'gatsby-plugin-styled-jsx': gatsbyPluginStyledJsx,
      ...cssInJsDependenciesBabel['styled-jsx'].devDependencies,
    },
  },
};

export function addStyleDependencies(host: Tree, style: string) {
  let installTask: GeneratorCallback;

  const extraDependencies = GATSBY_SPECIFIC_STYLE_DEPENDENCIES[style];

  if (!extraDependencies) return () => void 0;

  return addDependenciesToPackageJson(
    host,
    extraDependencies.dependencies,
    extraDependencies.devDependencies
  );
}
