"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeImplicitDependencies = exports.normalizeProjectTargets = exports.normalizeProjectNodes = void 0;
const find_matching_projects_1 = require("../../utils/find-matching-projects");
const project_configuration_utils_1 = require("../utils/project-configuration-utils");
async function normalizeProjectNodes(ctx, builder) {
    const toAdd = [];
    // Sorting projects by name to make sure that the order of projects in the graph is deterministic.
    // This is important to ensure that expanded properties referencing projects (e.g. implicit dependencies)
    // are also deterministic, and thus don't cause the calculated project configuration hash to shift.
    const projects = Object.keys(ctx.projects).sort();
    // Used for expanding implicit dependencies (e.g. `@proj/*` or `tag:foo`)
    const partialProjectGraphNodes = projects.reduce((graph, project) => {
        const projectConfiguration = ctx.projects[project];
        graph[project] = {
            name: project,
            type: projectConfiguration.projectType === 'library' ? 'lib' : 'app', // missing fallback to `e2e`
            data: {
                ...projectConfiguration,
            },
        };
        return graph;
    }, {});
    for (const key of projects) {
        const p = ctx.projects[key];
        p.implicitDependencies = normalizeImplicitDependencies(key, p.implicitDependencies, partialProjectGraphNodes);
        p.targets = normalizeProjectTargets(p, key);
        // TODO: remove in v16
        const projectType = p.projectType === 'application'
            ? key.endsWith('-e2e') || key === 'e2e'
                ? 'e2e'
                : 'app'
            : 'lib';
        const tags = ctx.projects?.[key]?.tags || [];
        toAdd.push({
            name: key,
            type: projectType,
            data: {
                ...p,
                tags,
            },
        });
    }
    // Sort by root directory length (do we need this?)
    toAdd.sort((a, b) => {
        if (!a.data.root)
            return -1;
        if (!b.data.root)
            return -1;
        return a.data.root.length > b.data.root.length ? -1 : 1;
    });
    toAdd.forEach((n) => {
        builder.addNode({
            name: n.name,
            type: n.type,
            data: n.data,
        });
    });
}
exports.normalizeProjectNodes = normalizeProjectNodes;
/**
 * Apply target defaults and normalization
 */
function normalizeProjectTargets(project, projectName) {
    // Any node on the graph will have a targets object, it just may be empty
    const targets = project.targets ?? {};
    for (const target in targets) {
        if (!targets[target].command && !targets[target].executor) {
            delete targets[target];
            continue;
        }
        targets[target].options = (0, project_configuration_utils_1.resolveNxTokensInOptions)(targets[target].options, project, `${projectName}:${target}`);
        targets[target].configurations ??= {};
        for (const configuration in targets[target].configurations) {
            targets[target].configurations[configuration] = (0, project_configuration_utils_1.resolveNxTokensInOptions)(targets[target].configurations[configuration], project, `${projectName}:${target}:${configuration}`);
        }
    }
    return targets;
}
exports.normalizeProjectTargets = normalizeProjectTargets;
function normalizeImplicitDependencies(source, implicitDependencies, projects) {
    if (!implicitDependencies?.length) {
        return implicitDependencies ?? [];
    }
    const matches = (0, find_matching_projects_1.findMatchingProjects)(implicitDependencies, projects);
    return (matches
        .filter((x) => x !== source)
        // implicit dependencies that start with ! should hang around, to be processed by
        // implicit-project-dependencies.ts after explicit deps are added to graph.
        .concat(implicitDependencies.filter((x) => x.startsWith('!'))));
}
exports.normalizeImplicitDependencies = normalizeImplicitDependencies;
