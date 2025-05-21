import { detectPackageManager } from '@nx/devkit';
import { getLockFileName } from 'nx/src/plugins/js/lock-file/lock-file';

export function maybeGetLockFiles(workspaceRoot: string): string[] | undefined {
  try {
    return [getLockFileName(detectPackageManager(workspaceRoot))];
  } catch {
    return undefined;
  }
}
