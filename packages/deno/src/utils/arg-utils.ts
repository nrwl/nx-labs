export type DenoTypeCheck = boolean | 'none' | 'local' | 'all';

/**
 * @returns the Deno flag to enable type checking based on the input schema value
 * */
export function processTypeCheckOption(check: DenoTypeCheck): string {
  if (check === 'none' || check === false) {
    return '--no-check';
  }
  if (check === 'all') {
    return '--check=all';
  }
  return '--check';
}
