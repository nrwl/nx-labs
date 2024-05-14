"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAcyclic = exports.findCycle = void 0;
function _findCycle(graph, id, visited, path) {
    if (visited[id])
        return null;
    visited[id] = true;
    for (const d of graph.dependencies[id]) {
        if (path.includes(d))
            return [...path, d];
        const cycle = _findCycle(graph, d, visited, [...path, d]);
        if (cycle)
            return cycle;
    }
    return null;
}
function findCycle(taskGraph) {
    const visited = {};
    for (const t of Object.keys(taskGraph.dependencies)) {
        visited[t] = false;
    }
    for (const t of Object.keys(taskGraph.dependencies)) {
        const cycle = _findCycle(taskGraph, t, visited, [t]);
        if (cycle)
            return cycle;
    }
    return null;
}
exports.findCycle = findCycle;
function _makeAcyclic(graph, id, visited, path) {
    if (visited[id])
        return;
    visited[id] = true;
    const deps = graph.dependencies[id];
    for (const d of [...deps]) {
        if (path.includes(d)) {
            deps.splice(deps.indexOf(d), 1);
        }
        else {
            _makeAcyclic(graph, d, visited, [...path, d]);
        }
    }
    return null;
}
function makeAcyclic(graph) {
    const visited = {};
    for (const t of Object.keys(graph.dependencies)) {
        visited[t] = false;
    }
    for (const t of Object.keys(graph.dependencies)) {
        _makeAcyclic(graph, t, visited, [t]);
    }
    graph.roots = Object.keys(graph.dependencies).filter((t) => graph.dependencies[t].length === 0);
}
exports.makeAcyclic = makeAcyclic;
