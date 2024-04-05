export declare function findCycle(taskGraph: {
    dependencies: Record<string, string[]>;
}): string[] | null;
export declare function makeAcyclic(graph: {
    roots: string[];
    dependencies: Record<string, string[]>;
}): void;
