export declare class MigrationHelper {
    /**
     * Runs 'steps' new upgrade migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    private static scriptPath;
    private static scriptPathSeed;
    static upgradeDatabase: (steps?: number, silent?: boolean, thePath?: string) => Promise<void>;
    /**
     * Runs 'steps' downgrade migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static downgradeDatabase: (steps?: number, silent?: boolean, thePath?: string) => Promise<void>;
    /**
     * Runs 'steps' new seed migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static seedDatabase: (steps?: number, silent?: boolean, thePath?: string) => Promise<void>;
    /**
     * Runs 'steps' unseed migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static unseedDatabase: (steps: number, silent?: boolean, thePath?: string) => Promise<void>;
    /**
     * Rebuilds database by downgrading everything and re-running migrations.
     */
    static rebuildDatabase: () => Promise<void>;
    static reSeedDatabase: () => Promise<void>;
    /**
     * Clears database by downgrading everything and re-running migrations.
     */
    static clearDatabase: () => Promise<void>;
    /**
     * Runs all downgrade migrations.
     */
    static dropDatabase: () => Promise<void>;
}
//# sourceMappingURL=migrations.d.ts.map