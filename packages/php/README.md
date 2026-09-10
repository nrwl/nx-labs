<p style="text-align: center;">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-dark.svg">
    <img alt="Nx - Smart Monorepos · Fast CI" src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-light.svg" width="100%">
  </picture>
</p>

> Note: this plugin is currently experimental.

# Nx: Smart Monorepos · Fast CI

Nx is a build system, optimized for monorepos, with plugins for popular frameworks and tools and advanced CI capabilities including caching and distribution.

This package is a PHP plugin for Nx with support for Composer, PHPUnit, and Laravel projects.

## Features

- **Composer Plugin**: Automatically detects `composer.json` files and creates targets for:
  - Installing dependencies (`install`)
  - Updating dependencies (`update`)
  - Running custom composer scripts
  - Building dependency graph for PHP packages

- **PHPUnit Plugin**: Automatically detects `phpunit.xml` files and creates targets for:
  - Running tests (`test`)
  - With proper caching and dependency management

- **Laravel Plugin**: Automatically detects Laravel projects (via `artisan` file) and creates targets for:
  - Serving the application (`serve`)
  - Running migrations (`migrate`, `migrate:fresh`)
  - Laravel Tinker REPL (`tinker`)
  - Queue workers (`queue:work`)
  - Cache management (`cache:clear`)
  - Route listing (`route:list`)
  - Custom artisan commands from composer.json

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

# Laravel-specific commands
# serve all Laravel apps
nx run-many -t serve

# run migrations for all Laravel apps
nx run-many -t migrate

# clear caches for all Laravel apps
nx run-many -t cache:clear
```

## Laravel Plugin Usage

The Laravel plugin automatically detects Laravel projects by looking for the `artisan` file and verifying the presence of Laravel framework in `composer.json`. Once detected, it creates the following targets:

```bash
# Development server
nx serve my-laravel-app

# Database migrations
nx migrate my-laravel-app
nx migrate:fresh my-laravel-app  # Fresh migration with seeding

# Laravel REPL
nx tinker my-laravel-app

# Queue management
nx queue:work my-laravel-app

# Cache management
nx cache:clear my-laravel-app

# Routes
nx route:list my-laravel-app
```

The plugin also detects and exposes any custom artisan commands defined in your `composer.json` scripts section.

## Documentation & Resources

- [Nx.Dev: Documentation, Guides, Tutorials](https://nx.dev)
- [Intro to Nx](https://nx.dev/getting-started/intro)
- [Official Nx YouTube Channel](https://www.youtube.com/@NxDevtools)
- [Blog Posts About Nx](https://nx.dev/blog)

<p style="text-align: center;"><a href="https://nx.dev/#learning-materials" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-courses-and-videos.svg" 
width="100%" alt="Nx - Smart Monorepos · Fast CI"></a></p>
