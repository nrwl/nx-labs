import { InitArgs } from '../init';
type Options = Pick<InitArgs, 'nxCloud' | 'interactive' | 'cacheable'>;
export declare function addNxToMonorepo(options: Options): Promise<void>;
export {};
