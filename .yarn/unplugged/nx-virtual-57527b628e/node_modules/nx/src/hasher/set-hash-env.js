"use strict";
// if using without the daemon, the hashEnv is always going to be the process.env.
// When using the daemon, we'll need to set the hashEnv with `setHashEnv`
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHashEnv = exports.setHashEnv = void 0;
let hashEnv = process.env;
/**
 * Set the environment to be used by the hasher
 * @param env
 */
function setHashEnv(env) {
    hashEnv = env;
}
exports.setHashEnv = setHashEnv;
/**
 * Get the environment used by the hasher
 */
function getHashEnv() {
    return hashEnv;
}
exports.getHashEnv = getHashEnv;
