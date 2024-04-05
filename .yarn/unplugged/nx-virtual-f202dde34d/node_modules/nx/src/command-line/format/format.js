"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = void 0;
const child_process_1 = require("child_process");
const path = require("path");
const command_line_utils_1 = require("../../utils/command-line-utils");
const ignore_1 = require("../../utils/ignore");
const fileutils_1 = require("../../utils/fileutils");
const file_utils_1 = require("../../project-graph/file-utils");
const prettier = require("prettier");
const object_sort_1 = require("../../utils/object-sort");
const package_json_1 = require("../../utils/package-json");
const typescript_1 = require("../../plugins/js/utils/typescript");
const project_graph_1 = require("../../project-graph/project-graph");
const affected_project_graph_1 = require("../../project-graph/affected/affected-project-graph");
const configuration_1 = require("../../config/configuration");
const chunkify_1 = require("../../utils/chunkify");
const all_file_data_1 = require("../../utils/all-file-data");
const workspace_root_1 = require("../../utils/workspace-root");
const output_1 = require("../../utils/output");
const PRETTIER_PATH = getPrettierPath();
async function format(command, args) {
    const { nxArgs } = (0, command_line_utils_1.splitArgsIntoNxArgsAndOverrides)(args, 'affected', { printWarnings: false }, (0, configuration_1.readNxJson)());
    const patterns = (await getPatterns({ ...args, ...nxArgs })).map(
    // prettier removes one of the \
    // prettier-ignore
    (p) => `"${p.replace(/\$/g, "\\\$")}"`);
    // Chunkify the patterns array to prevent crashing the windows terminal
    const chunkList = (0, chunkify_1.chunkify)(patterns);
    switch (command) {
        case 'write':
            sortTsConfig();
            addRootConfigFiles(chunkList, nxArgs);
            chunkList.forEach((chunk) => write(chunk));
            break;
        case 'check':
            const pass = chunkList.reduce((pass, chunk) => check(chunk) && pass, true);
            if (!pass) {
                process.exit(1);
            }
            break;
    }
}
exports.format = format;
async function getPatterns(args) {
    const graph = await (0, project_graph_1.createProjectGraphAsync)({ exitOnError: true });
    const allFilesPattern = ['.'];
    if (args.all) {
        return allFilesPattern;
    }
    try {
        if (args.projects && args.projects.length > 0) {
            return getPatternsFromProjects(args.projects, graph);
        }
        const p = (0, command_line_utils_1.parseFiles)(args);
        // In prettier v3 the getSupportInfo result is a promise
        const supportedExtensions = new Set((await prettier.getSupportInfo()).languages
            .flatMap((language) => language.extensions)
            .filter((extension) => !!extension)
            // Prettier supports ".swcrc" as a file instead of an extension
            // So we add ".swcrc" as a supported extension manually
            // which allows it to be considered for calculating "patterns"
            .concat('.swcrc'));
        const patterns = p.files
            .map((f) => path.relative(workspace_root_1.workspaceRoot, f))
            .filter((f) => (0, fileutils_1.fileExists)(f) && supportedExtensions.has(path.extname(f)));
        // exclude patterns in .nxignore or .gitignore
        const nonIgnoredPatterns = (0, ignore_1.getIgnoreObject)().filter(patterns);
        return args.libsAndApps
            ? await getPatternsFromApps(nonIgnoredPatterns, await (0, all_file_data_1.allFileData)(), graph)
            : nonIgnoredPatterns;
    }
    catch (err) {
        output_1.output.error({
            title: err?.message ||
                'Something went wrong when resolving the list of files for the formatter',
            bodyLines: [`Defaulting to all files pattern: "${allFilesPattern}"`],
        });
        return allFilesPattern;
    }
}
async function getPatternsFromApps(affectedFiles, allWorkspaceFiles, projectGraph) {
    const graph = await (0, project_graph_1.createProjectGraphAsync)({ exitOnError: true });
    const affectedGraph = await (0, affected_project_graph_1.filterAffected)(graph, (0, file_utils_1.calculateFileChanges)(affectedFiles, allWorkspaceFiles));
    return getPatternsFromProjects(Object.keys(affectedGraph.nodes), projectGraph);
}
function addRootConfigFiles(chunkList, nxArgs) {
    if (nxArgs.all) {
        return;
    }
    const chunk = [];
    const addToChunkIfNeeded = (file) => {
        if (chunkList.every((c) => !c.includes(`"${file}"`))) {
            chunk.push(file);
        }
    };
    // if (workspaceJsonPath) {
    //   addToChunkIfNeeded(workspaceJsonPath);
    // }
    ['nx.json', (0, typescript_1.getRootTsConfigFileName)()]
        .filter(Boolean)
        .forEach(addToChunkIfNeeded);
    if (chunk.length > 0) {
        chunkList.push(chunk);
    }
}
function getPatternsFromProjects(projects, projectGraph) {
    return (0, command_line_utils_1.getProjectRoots)(projects, projectGraph);
}
function write(patterns) {
    if (patterns.length > 0) {
        const [swcrcPatterns, regularPatterns] = patterns.reduce((result, pattern) => {
            result[pattern.includes('.swcrc') ? 0 : 1].push(pattern);
            return result;
        }, [[], []]);
        (0, child_process_1.execSync)(`node "${PRETTIER_PATH}" --write --list-different ${regularPatterns.join(' ')}`, {
            stdio: [0, 1, 2],
        });
        if (swcrcPatterns.length > 0) {
            (0, child_process_1.execSync)(`node "${PRETTIER_PATH}" --write --list-different ${swcrcPatterns.join(' ')} --parser json`, {
                stdio: [0, 1, 2],
            });
        }
    }
}
function check(patterns) {
    if (patterns.length === 0) {
        return true;
    }
    try {
        (0, child_process_1.execSync)(`node "${PRETTIER_PATH}" --list-different ${patterns.join(' ')}`, {
            stdio: [0, 1, 2],
        });
        return true;
    }
    catch {
        return false;
    }
}
function sortTsConfig() {
    try {
        const tsconfigPath = (0, typescript_1.getRootTsConfigPath)();
        const tsconfig = (0, fileutils_1.readJsonFile)(tsconfigPath);
        const sortedPaths = (0, object_sort_1.sortObjectByKeys)(tsconfig.compilerOptions.paths);
        tsconfig.compilerOptions.paths = sortedPaths;
        (0, fileutils_1.writeJsonFile)(tsconfigPath, tsconfig);
    }
    catch (e) {
        // catch noop
    }
}
function getPrettierPath() {
    const { bin } = (0, package_json_1.readModulePackageJson)('prettier').packageJson;
    return require.resolve(path.join('prettier', bin));
}
