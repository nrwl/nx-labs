"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yargsResetCommand = void 0;
exports.yargsResetCommand = {
    command: 'reset',
    describe: 'Clears all the cached Nx artifacts and metadata about the workspace and shuts down the Nx Daemon.',
    aliases: ['clear-cache'],
    handler: async () => (await Promise.resolve().then(() => require('./reset'))).resetHandler(),
};
