"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsDepGraphCommand = void 0;
const documentation_1 = require("../yargs-utils/documentation");
const shared_options_1 = require("../yargs-utils/shared-options");
exports.yargsDepGraphCommand = {
    command: 'graph',
    describe: 'Graph dependencies within workspace',
    aliases: ['dep-graph'],
    builder: (yargs) => (0, documentation_1.linkToNxDevAndExamples)((0, shared_options_1.withAffectedOptions)((0, shared_options_1.withDepGraphOptions)(yargs)), 'dep-graph')
        .option('affected', {
        type: 'boolean',
        description: 'Highlight affected projects',
    })
        .implies('untracked', 'affected')
        .implies('uncommitted', 'affected')
        .implies('files', 'affected')
        .implies('base', 'affected')
        .implies('head', 'affected'),
    handler: async (args) => await (await Promise.resolve().then(() => require('./graph'))).generateGraph(args, []),
};
