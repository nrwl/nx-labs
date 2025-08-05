import { Tree, globAsync, joinPathFragments, logger } from '@nx/devkit';
import { Builder, parseString } from 'xml2js';
import { PLUGIN_VERSION } from '../../utils/versions';
import { InitGeneratorSchema } from './schema';

interface MavenPlugin {
  $: Record<string, unknown>;
  groupId: string[];
  artifactId: string[];
  version: string[];
  executions?: Array<{
    $: Record<string, unknown>;
    execution: Array<{
      $: Record<string, unknown>;
      id: string[];
      goals: Array<{
        $: Record<string, unknown>;
        goal: string[];
      }>;
    }>;
  }>;
}

interface MavenPlugins {
  $: Record<string, unknown>;
  plugin: MavenPlugin[];
}

interface MavenBuild {
  $: Record<string, unknown>;
  plugins?: MavenPlugins[];
}

interface MavenProject {
  $: Record<string, unknown>;
  project: {
    $: Record<string, unknown>;
    build?: MavenBuild[] | MavenBuild;
    [key: string]: unknown;
  };
}

function isMavenProject(obj: unknown): obj is MavenProject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'project' in obj &&
    typeof (obj as any).project === 'object' &&
    (obj as any).project !== null
  );
}

/**
 * Ensures a path exists in an object, creating missing parts as needed.
 * @param obj The object to ensure the path exists in
 * @param path Array of property names representing the path
 * @param isArrayPath Array of booleans indicating if each path segment should be an array
 * @returns The final object in the path
 */
function ensurePath(obj: any, path: string[], isArrayPath: boolean[]): any {
  let current = obj;

  for (let i = 0; i < path.length; i++) {
    const prop = path[i];
    const shouldBeArray = isArrayPath[i];

    if (!current[prop]) {
      current[prop] = shouldBeArray ? [{ $: {} }] : { $: {} };
    }

    // Navigate to the next level (get first element if it's an array)
    current =
      shouldBeArray && Array.isArray(current[prop])
        ? current[prop][0]
        : current[prop];
  }

  return current;
}

/**
 * Ensures a property exists as an array in the given object.
 * @param obj The object to ensure the array property exists in
 * @param prop The property name that should be an array
 */
function ensureArray(obj: any, prop: string): void {
  if (!obj[prop]) {
    obj[prop] = [];
  } else if (!Array.isArray(obj[prop])) {
    obj[prop] = [obj[prop]];
  }
}

/**
 * Generates the Maven goal string for the Nx Maven plugin analyze goal.
 * @param version The plugin version to use
 * @returns The formatted Maven goal string
 */
export function getMavenAnalyzeGoal(version: string): string {
  return `dev.nx.maven:project-graph:${version}:analyze`;
}

export async function addMavenPlugin(tree: Tree) {
  // Find all pom.xml files in the workspace
  const pomFiles = await globAsync(tree, ['**/pom.xml']);

  if (pomFiles.length === 0) {
    logger.warn(
      'No pom.xml files found in the workspace. Please ensure you have Maven projects configured.'
    );
    return;
  }

  logger.info(
    `Found ${pomFiles.length} pom.xml files. Adding dev.nx.maven.project-graph Maven plugin configuration...`
  );

  // Add the Nx Maven plugin to the root pom.xml if it exists
  const rootPomPath = 'pom.xml';
  if (tree.exists(rootPomPath)) {
    await addNxMavenPluginToPom(tree, rootPomPath);
  }

  // Process all pom.xml files
  for (const pomFile of pomFiles) {
    // Skip root pom.xml as it's already processed
    if (pomFile === rootPomPath) {
      continue;
    }

    await addNxMavenPluginToPom(tree, pomFile);
  }
}

async function addNxMavenPluginToPom(tree: Tree, pomPath: string) {
  const pomContent = tree.read(pomPath, 'utf-8');

  if (!pomContent) {
    logger.warn(`Unable to read ${pomPath}`);
    return;
  }

  // Check if the dev.nx.maven.project-graph plugin is already configured
  if (
    (pomContent.includes('dev.nx.maven') &&
      pomContent.includes('project-graph')) ||
    pomContent.includes('nx.analyzer.goal')
  ) {
    logger.info(
      'dev.nx.maven.project-graph plugin already configured in pom.xml'
    );
    return;
  }

  try {
    // Parse the XML to add the plugin
    const updatedPomContent = await addNxMavenPluginToXml(pomContent);

    if (updatedPomContent !== pomContent) {
      tree.write(pomPath, updatedPomContent);
      logger.info(`Added dev.nx.maven.project-graph plugin to ${pomPath}`);
    }
  } catch (error) {
    logger.error(`Failed to parse XML in ${pomPath}: ${error.message}`);
    // Fallback to the original regex-based approach if XML parsing fails
    const updatedPomContent = addNxMavenPluginToXmlFallback(pomContent);
    if (updatedPomContent !== pomContent) {
      tree.write(pomPath, updatedPomContent);
      logger.info(
        `Added dev.nx.maven.project-graph plugin to ${pomPath} (fallback)`
      );
    }
  }
}

async function addNxMavenPluginToXml(pomContent: string): Promise<string> {
  // Parse XML using xml2js
  const result = await new Promise<unknown>((resolve, reject) => {
    parseString(
      pomContent,
      {
        preserveChildrenOrder: true,
        explicitChildren: true,
        explicitArray: false,
        ignoreAttrs: false,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });

  // Validate the parsed XML structure
  if (!isMavenProject(result)) {
    throw new Error(
      'Invalid POM structure: parsed XML does not match expected Maven project format'
    );
  }

  // Create the Nx Maven plugin configuration
  const nxMavenPlugin = {
    $: {},
    groupId: ['dev.nx.maven'],
    artifactId: ['project-graph'],
    version: [PLUGIN_VERSION],
    executions: [
      {
        $: {},
        execution: [
          {
            $: {},
            id: ['nx-analyze'],
            goals: [
              {
                $: {},
                goal: ['analyze'],
              },
            ],
          },
        ],
      },
    ],
  };

  // Navigate to the project root (now safely typed after validation)
  const project = result.project;

  // Ensure build > plugins > plugin[] path exists
  // build is an array, plugins is an array, plugin is an array
  const buildSection = ensurePath(project, ['build'], [true]);
  const pluginsSection = ensurePath(buildSection, ['plugins'], [true]);
  ensureArray(pluginsSection, 'plugin');

  // Add the Nx Maven plugin
  pluginsSection.plugin.push(nxMavenPlugin);

  // Convert back to XML
  const builder = new Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '    ' },
  });

  return builder.buildObject(result);
}

// Fallback function using the original regex approach
function addNxMavenPluginToXmlFallback(pomContent: string): string {
  // Find the <plugins> section
  const pluginsRegex = /<plugins>\s*$/gm;
  const pluginsMatch = pluginsRegex.exec(pomContent);

  if (!pluginsMatch) {
    // No plugins section found, need to add build section
    return addBuildSectionWithPlugin(pomContent);
  }

  // Add the plugin after the <plugins> tag
  const nxMavenPlugin = `
            <plugin>
                <groupId>dev.nx.maven</groupId>
                <artifactId>project-graph</artifactId>
                <version>${PLUGIN_VERSION}</version>
                <executions>
                    <execution>
                        <id>nx-analyze</id>
                        <goals>
                            <goal>analyze</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>`;

  const insertIndex = pluginsMatch.index + pluginsMatch[0].length;
  return (
    pomContent.slice(0, insertIndex) +
    nxMavenPlugin +
    pomContent.slice(insertIndex)
  );
}

function addBuildSectionWithPlugin(pomContent: string): string {
  // Find the end of <dependencies> section or before </project>
  const dependenciesEndRegex = /<\/dependencies>\s*$/gm;
  const dependenciesEndMatch = dependenciesEndRegex.exec(pomContent);

  const projectEndRegex = /<\/project>\s*$/gm;
  const projectEndMatch = projectEndRegex.exec(pomContent);

  if (!projectEndMatch) {
    logger.warn('Unable to find </project> tag in pom.xml');
    return pomContent;
  }

  const insertIndex = dependenciesEndMatch
    ? dependenciesEndMatch.index + dependenciesEndMatch[0].length
    : projectEndMatch.index;

  const buildSection = `
    <build>
        <plugins>
            <plugin>
                <groupId>dev.nx.maven</groupId>
                <artifactId>project-graph</artifactId>
                <version>${PLUGIN_VERSION}</version>
                <executions>
                    <execution>
                        <id>nx-analyze</id>
                        <goals>
                            <goal>analyze</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
`;

  return (
    pomContent.slice(0, insertIndex) +
    buildSection +
    pomContent.slice(insertIndex)
  );
}

export function detectMavenWrapper(tree: Tree): string {
  // Check for Maven wrapper scripts
  if (tree.exists('mvnw') || tree.exists('mvnw.cmd')) {
    return './mvnw';
  }

  return 'mvn';
}

export function getMavenExecutable(
  tree: Tree,
  options: InitGeneratorSchema
): string {
  if (options.mavenExecutable) {
    return options.mavenExecutable;
  }

  return detectMavenWrapper(tree);
}

export function createMavenWrapperIfNeeded(tree: Tree) {
  // Check if Maven wrapper already exists
  if (tree.exists('mvnw') || tree.exists('mvnw.cmd')) {
    return;
  }

  // Create basic Maven wrapper configuration
  const mvnwProperties = `
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.4/apache-maven-3.9.4-bin.zip
wrapperUrl=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar
`;

  const wrapperDir = '.mvn/wrapper';
  tree.write(
    joinPathFragments(wrapperDir, 'maven-wrapper.properties'),
    mvnwProperties.trim()
  );

  // Note: In a real implementation, you would also need to add the actual wrapper scripts
  // For now, we'll just create the properties file
  logger.info(
    'Created Maven wrapper configuration. Please run "mvn wrapper:wrapper" to complete the setup.'
  );
}
