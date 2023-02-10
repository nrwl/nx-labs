import {
  FileData,
  ProjectGraph,
  ProjectGraphBuilder,
  ProjectGraphProcessorContext,
  workspaceRoot,
} from '@nrwl/devkit';
import {
  createProjectRootMappings,
  findProjectForPath,
} from 'nx/src/project-graph/utils/find-project-for-path';
import { extname, join, relative } from 'path';
import { runDeno } from '../utils/run-deno';

// TODO: can this be configurable via plugin settings?
const ALLOWED_FILE_EXT = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.json',
];

export async function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
): Promise<ProjectGraph> {
  const builder = new ProjectGraphBuilder(graph);
  const projectRootMap = createProjectRootMappings(graph.nodes);
  const processes: Array<Promise<void>> = [];

  const addDepsCb =
    (_sourceProject: string, _fileToProcess: FileData) =>
    (_resolvedFilePath: string) => {
      const targetProject = findProjectForPath(
        _resolvedFilePath,
        projectRootMap
      );
      if (targetProject) {
        builder.addExplicitDependency(
          _sourceProject,
          _fileToProcess.file,
          targetProject
        );
      }
      // TODO: handle external deps?
    };

  // TODO: maybe we should batch the files to prevent spawning too many processes at once?
  for (const project in context.filesToProcess) {
    for (const file of context.filesToProcess[project]) {
      if (ALLOWED_FILE_EXT.includes(extname(file.file))) {
        // TODO: should we check of a deno.json is in the project root
        // and exit so we don't spin up extra processes if not needed?
        processes.push(processFileWithContext(file, addDepsCb(project, file)));
      }
    }
  }

  await Promise.all(processes);

  return builder.getUpdatedProjectGraph();
}

async function processFileWithContext(
  fileToProcess: FileData,
  contextProcessor: (filePathFromRoot: string) => void
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
    const fileFromWorkspaceRoot = relative(
      workspaceRoot,
      dep.code.specifier.replace('file://', '')
    );
    contextProcessor(fileFromWorkspaceRoot);
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
