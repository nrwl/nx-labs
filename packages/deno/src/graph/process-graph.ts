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
const BATCH_SIZE = 5;

export async function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
): Promise<ProjectGraph> {
  const builder = new ProjectGraphBuilder(graph);
  const projectRootMap = createProjectRootMappings(graph.nodes);
  const processes: Array<Promise<void>> = [];

  const addDepToGraph =
    (_sourceProject: string, _fileToProcess: FileData) =>
    (_resolvedTargetFilePath: string) => {
      const targetProject = findProjectForPath(
        _resolvedTargetFilePath,
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

  for (const [name, project] of Object.entries(
    context.projectsConfigurations.projects
  )) {
    // TODO: we might need to use the files in the graph as adding adding to
    // existing workspace might already have files processed by the graph
    // const filesInProject = context.fileMap[name].filter((f) =>
    //   ALLOWED_FILE_EXT.includes(extname(f.file))
    // );
    const filesInProject = context.filesToProcess[name].filter((f) =>
      ALLOWED_FILE_EXT.includes(extname(f.file))
    );
    if (!isDenoProject(project) || filesInProject.length === 0) {
      continue;
    }
    for (const file of filesInProject) {
      // TODO: should process in queue of X (CPU - 1?) workers.
      processes.push(processFileInfo(file, addDepToGraph(name, file)));
    }
  }

  // for (const project in context.filesToProcess) {
  //   for (const file of context.filesToProcess[project]) {
  //     if (ALLOWED_FILE_EXT.includes(extname(file.file))) {
  //       // TODO: should we check of a deno.json is in the project root
  //       // and exit so we don't spin up extra processes if not needed?
  //       processes.push(processFileWithContext(file, addDepsCb(project, file)));
  //     }
  //   }
  // }

  await Promise.all(processes);

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
    const targetFileFromWorkspaceRoot = relative(
      workspaceRoot,
      dep.code.specifier.replace('file://', '')
    );
    handleTargetFile(targetFileFromWorkspaceRoot);
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
