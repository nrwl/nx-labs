<p style="text-align: center;">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-dark.svg">
    <img alt="Nx - Smart Monorepos · Fast CI" src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-light.svg" width="100%">
  </picture>
</p>

> Note: this plugin is currently experimental.

# Nx: Smart Monorepos · Fast CI

Nx is a build system, optimized for monorepos, with plugins for popular frameworks and tools and advanced CI capabilities including caching and distribution.

This package is a PHP plugin for Nx.

## Getting Started

Make sure you have Nx installed on your machine:

```bash
# Homebrew (Mac/Linux)
brew tap nrwl/nx
brew install nx

# Chocolatey (Windows)
choco install nx

# NPM/Node.js
npx install -g nx@latest
```

Then initialize it in your workspace: (follow the prompts)

```bash
nx init
```

Add the PHP plugin to your workspace:

```bash
nx add @nx/php
```

You can now view your projects:

```bash
# list all projects
nx show projets

# show projects as a graph
nx graph

# run composer install or update for all projects
nx run-many -t install
nx run-many -t update

# run tests for all projects
nx run-many -t test
```

## Documentation & Resources

- [Nx.Dev: Documentation, Guides, Tutorials](https://nx.dev)
- [Intro to Nx](https://nx.dev/getting-started/intro)
- [Official Nx YouTube Channel](https://www.youtube.com/@NxDevtools)
- [Blog Posts About Nx](https://nx.dev/blog)

<p style="text-align: center;"><a href="https://nx.dev/#learning-materials" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-courses-and-videos.svg" 
width="100%" alt="Nx - Smart Monorepos · Fast CI"></a></p>
