import { Tree } from '../../../generators/tree';
interface ConnectToNxCloudOptions {
    analytics: boolean;
    installationSource: string;
    hideFormatLogs?: boolean;
}
export declare function connectToNxCloud(tree: Tree, schema: ConnectToNxCloudOptions): Promise<() => void>;
export default connectToNxCloud;
