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

type XmlObject = Record<string, unknown> & { $: Record<string, unknown> };
type XmlStructure = XmlObject | XmlObject[];

/**
 * Creates a default XML2JS object structure with required $ property.
 * @param shouldBeArray Whether this should be wrapped in an array
 * @returns The default structure
 */
function createDefaultXmlStructure(shouldBeArray: boolean): XmlStructure {
  const defaultObj: XmlObject = { $: {} };
  return shouldBeArray ? [defaultObj] : defaultObj;
}

/**
 * Navigates to the next level in an XML structure, handling arrays appropriately.
 * @param obj The current object to navigate from
 * @param shouldBeArray Whether the current level should be treated as an array
 * @returns The next level object to continue navigation
 */
function navigateToNextLevel(
  obj: unknown,
  shouldBeArray: boolean
): Record<string, unknown> {
  if (shouldBeArray && Array.isArray(obj)) {
    return obj[0] as Record<string, unknown>;
  }
  return obj as Record<string, unknown>;
}

/**
 * Ensures a single property exists in an object with the correct structure.
 * @param obj The object to ensure the property exists in
 * @param prop The property name
 * @param shouldBeArray Whether this property should be an array
 * @returns The created or existing property value
 */
function ensureProperty(
  obj: Record<string, unknown>,
  prop: string,
  shouldBeArray: boolean
): XmlStructure {
  if (!obj[prop]) {
    obj[prop] = createDefaultXmlStructure(shouldBeArray);
  }
  return obj[prop] as XmlStructure;
}

/**
 * Ensures a path exists in an object, creating missing parts as needed.
 * @param obj The object to ensure the path exists in
 * @param path Array of property names representing the path
 * @param isArrayPath Array of booleans indicating if each path segment should be an array
 * @returns The final object in the path
 */
function ensurePath<T extends Record<string, unknown>>(
  obj: T,
  path: string[],
  isArrayPath: boolean[]
): Record<string, unknown> {
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < path.length; i++) {
    const prop = path[i];
    const shouldBeArray = isArrayPath[i];

    // Ensure the property exists with correct structure
    const propertyValue = ensureProperty(current, prop, shouldBeArray);

    // Navigate to the next level
    current = navigateToNextLevel(propertyValue, shouldBeArray);
  }

  return current;
}

/**
 * Ensures a property exists as an array in the given object.
 * @param obj The object to ensure the array property exists in
 * @param prop The property name that should be an array
 */
function ensureArray<T extends Record<string, unknown>>(
  obj: T,
  prop: string
): void {
  if (!obj[prop]) {
    (obj as Record<string, unknown>)[prop] = [];
  } else if (!Array.isArray(obj[prop])) {
    (obj as Record<string, unknown>)[prop] = [obj[prop]];
  }
}

/**
 * Generates detailed error information for XML parsing failures.
 * @param error The error that occurred during XML parsing
 * @param pomPath The path to the POM file that failed to parse
 * @returns A detailed error message with debugging information
 */
function getXmlParsingErrorDetails(error: unknown, pomPath: string): string {
  const baseMessage = `Failed to parse XML in ${pomPath}`;

  if (error instanceof Error) {
    const errorMessage = error.message;

    // Common XML parsing errors and their explanations
    if (errorMessage.includes('Unexpected close tag')) {
      return `${baseMessage}: Mismatched XML tags detected. ${errorMessage}. Please check that all opening tags have corresponding closing tags.`;
    }

    if (
      errorMessage.includes('Unexpected end of input') ||
      errorMessage.includes('Unclosed tag')
    ) {
      return `${baseMessage}: Incomplete XML structure detected. ${errorMessage}. The XML file may be truncated or missing closing tags.`;
    }

    if (
      errorMessage.includes('Invalid character') ||
      errorMessage.includes('not well-formed')
    ) {
      return `${baseMessage}: Invalid XML characters or structure detected. ${errorMessage}. Please ensure the XML is well-formed and uses valid characters.`;
    }

    if (errorMessage.includes('Unexpected token')) {
      return `${baseMessage}: Invalid XML syntax detected. ${errorMessage}. Please check for special characters that need to be escaped or malformed XML elements.`;
    }

    // Generic error with the original message
    return `${baseMessage}: ${errorMessage}. Please verify that the POM file contains valid XML syntax.`;
  }

  // Fallback for non-Error objects
  return `${baseMessage}: Unknown parsing error occurred. Please verify that the POM file contains valid XML syntax.`;
}

/**
 * Generates the Maven goal string for the Nx Maven plugin analyze goal.
 * @param version The plugin version to use
 * @returns The formatted Maven goal string
 */
export function getMavenAnalyzeGoal(version: string): string {
  return `dev.nx.maven:project-graph:${version}:analyze`;
}

// Maven archetype constants
export const MAVEN_ARCHETYPE_COORDINATES = {
  QUICKSTART: 'maven-archetype-quickstart',
  WEBAPP: 'maven-archetype-webapp',
  SIMPLE: 'maven-archetype-simple',
} as const;

export const DEFAULT_MAVEN_COORDINATES = {
  GROUP_ID: 'com.example',
  ARTIFACT_ID: 'my-app',
} as const;

/**
 * Builds Maven archetype generation command arguments.
 * @param options Configuration for the archetype generation
 * @returns Array of Maven command arguments
 */
export function buildMavenArchetypeArgs(options: {
  groupId?: string;
  artifactId?: string;
  archetypeArtifactId?: string;
  interactiveMode?: boolean;
  additionalProperties?: Record<string, string>;
}): string[] {
  const {
    groupId = DEFAULT_MAVEN_COORDINATES.GROUP_ID,
    artifactId = DEFAULT_MAVEN_COORDINATES.ARTIFACT_ID,
    archetypeArtifactId = MAVEN_ARCHETYPE_COORDINATES.QUICKSTART,
    interactiveMode = false,
    additionalProperties = {},
  } = options;

  const args = [
    'archetype:generate',
    `-DgroupId=${groupId}`,
    `-DartifactId=${artifactId}`,
    `-DarchetypeArtifactId=${archetypeArtifactId}`,
    `-DinteractiveMode=${interactiveMode}`,
  ];

  // Add any additional properties
  for (const [key, value] of Object.entries(additionalProperties)) {
    args.push(`-D${key}=${value}`);
  }

  return args;
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
    const errorDetails = getXmlParsingErrorDetails(error, pomPath);
    logger.error(errorDetails);
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
  const result = await new Promise<MavenProject>((resolve, reject) => {
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
      `Invalid POM structure: expected root element <project>, but found top-level keys: [${Object.keys(result).join(', ')}]`
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
  if (!pluginsSection) {
    throw new Error('Invalid POM structure: <plugins> section is missing or malformed');
  }
  ensureArray(pluginsSection, 'plugin');

  // Add the Nx Maven plugin
  (pluginsSection.plugin as MavenPlugin[]).push(nxMavenPlugin);

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
