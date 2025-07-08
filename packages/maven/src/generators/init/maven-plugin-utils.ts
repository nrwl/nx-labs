import { Tree, globAsync, joinPathFragments, logger } from '@nx/devkit';
import { InitGeneratorSchema } from './schema';

export async function addMavenPlugin(
  tree: Tree,
  _options: InitGeneratorSchema
) {
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
    pomContent.includes('dev.nx.maven.project-graph') ||
    pomContent.includes('nx.analyzer.goal')
  ) {
    logger.info(
      `dev.nx.maven.project-graph plugin already configured in ${pomPath}`
    );
    return;
  }

  // Parse the XML to add the plugin
  const updatedPomContent = addNxMavenPluginToXml(pomContent);

  if (updatedPomContent !== pomContent) {
    tree.write(pomPath, updatedPomContent);
    logger.info(`Added dev.nx.maven.project-graph plugin to ${pomPath}`);
  }
}

function addNxMavenPluginToXml(pomContent: string): string {
  // This is a simplified XML manipulation
  // In a real implementation, you might want to use a proper XML parser

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
                <version>1.0.0-SNAPSHOT</version>
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
                <version>1.0.0-SNAPSHOT</version>
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
