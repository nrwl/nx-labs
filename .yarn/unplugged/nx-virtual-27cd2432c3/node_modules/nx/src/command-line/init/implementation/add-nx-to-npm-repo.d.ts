import { InitArgs } from '../init';
type Options = Pick<InitArgs, 'nxCloud' | 'interactive' | 'cacheable'>;
export declare function addNxToNpmRepo(options: Options): Promise<void>;
export {};
