import {
  FileData,
  ProjectConfiguration,
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
  workspaceRoot,
} from '@nrwl/devkit';
import { existsSync } from 'fs';
import {
  createProjectRootMappings,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path';
import { extname, join, relative } from 'path';
import { runDeno } from '../utils/run-deno';

const ALLOWED_FILE_EXT = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.json',
];
const BATCH_SIZE = 10;

export async function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
): Promise<ProjectGraph> {
  const builder = new ProjectGraphBuilder(graph);
  const projectRootMap = createProjectRootMappings(graph.nodes);
  const processes: Array<() => Promise<void>> = [];

  const addDepToGraph =
    (_sourceProject: string, _fileToProcess: FileData) =>
    (_resolvedTargetFilePath: string) => {
      const targetProject = findProjectForPath(
        _resolvedTargetFilePath,
        projectRootMap
      );
      if (!targetProject) {
        return;
      }
      builder.addExplicitDependency(
        _sourceProject,
        _fileToProcess.file,
        targetProject
      );
    };

  for (const [name, project] of Object.entries(
    context.projectsConfigurations.projects
  )) {
    // NOTE (chau, caleb) we're using the fileMap instead of fileToProcess
    // because the DAEMON already processed ts files that we need to process even in brand new workspace.
    const filesInProject = context.fileMap[name].filter((f) =>
      ALLOWED_FILE_EXT.includes(extname(f.file))
    );
    if (!isDenoProject(project) || filesInProject.length === 0) {
      continue;
    }

    for (const file of filesInProject) {
      processes.push(() => processFileInfo(file, addDepToGraph(name, file)));
    }
  }

  const batchedProcesses: Array<typeof processes> = [];

  while (processes.length > 0) {
    batchedProcesses.push(processes.splice(0, BATCH_SIZE));
  }

  for (const batch of batchedProcesses) {
    await Promise.all(batch.map((fn) => fn()));
  }

  return builder.getUpdatedProjectGraph();
}

function isDenoProject(project: ProjectConfiguration) {
  if (existsSync(join(workspaceRoot, project.root, 'deno.json'))) {
    return true;
  }

  if (
    Object.values(project.targets).some((target) =>
      target.executor.startsWith('@nrwl/deno')
    )
  ) {
    return true;
  }

  return false;
}

async function processFileInfo(
  fileToProcess: FileData,
  handleTargetFile: (targetFilePath: string) => void
) {
  const fileInfo: Partial<DenoInfoOutput> = await getDenoFileInfo(
    fileToProcess
  ).catch((e) => {
    throw new DenoError(`Error trying to process '${fileToProcess.file}'`, e);
  });

  const fileFullPath = join(workspaceRoot, fileToProcess.file);

  const depInfo = fileInfo?.modules?.find(
    (m) => m?.specifier === `file://${fileFullPath}`
  )?.dependencies;

  if (!depInfo) return;

  for (const dep of depInfo) {
    if (dep.code.specifier.startsWith('files://')) {
      const targetFileFromWorkspaceRoot = relative(
        workspaceRoot,
        dep.code.specifier.replace('file://', '')
      );
      handleTargetFile(targetFileFromWorkspaceRoot);
    } else {
      // TODO(Caleb & Chau) handle external nodes
    }
  }
}

async function getDenoFileInfo(fileToProcess: FileData) {
  const denoInfo = runDeno(
    [
      'info',
      '--import-map=import_map.json',
      '--json',
      '--unstable',
      '--no-config',
      fileToProcess.file,
    ],
    { stdio: 'pipe' }
  );
  return await new Promise((res) => {
    let buffer = '';

    denoInfo.stdout.on('data', (chunk) => {
      buffer += chunk;
    });

    denoInfo.on('close', () => {
      res(JSON.parse(buffer));
    });
  });
}

class DenoError extends Error {
  constructor(message: string, public readonly innerError: Error) {
    super(message);
  }
}

interface DenoInfoOutput {
  modules: DenoModule[];
}

interface DenoModule {
  specifier: string;
  dependencies?: DenoDependency[];
}

interface DenoDependency {
  specifier: string;
  code: {
    specifier: string;
  };
}
