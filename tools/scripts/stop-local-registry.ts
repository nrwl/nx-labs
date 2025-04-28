/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

/// <reference path="registry.d.ts" />

export default () => {
  if (global.stopLocalRegistry) {
    global.stopLocalRegistry();
  }
};
