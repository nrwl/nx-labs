type NestedFiles = {
    [fileName: string]: string;
};
export declare class TempFs {
    private dirname;
    readonly tempDir: string;
    constructor(dirname: string, overrideWorkspaceRoot?: boolean);
    createFiles(fileObject: NestedFiles): Promise<void>;
    createFilesSync(fileObject: NestedFiles): void;
    createFile(filePath: string, content: string): Promise<void>;
    createFileSync(filePath: string, content: string): void;
    readFile(filePath: string): Promise<string>;
    removeFileSync(filePath: string): void;
    appendFile(filePath: string, content: string): void;
    writeFile(filePath: string, content: string): void;
    renameFile(oldPath: string, newPath: string): void;
    cleanup(): void;
    reset(): void;
}
export {};
