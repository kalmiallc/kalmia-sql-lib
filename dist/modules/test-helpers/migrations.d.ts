export declare class MigrationHelper {
    /**
     * Runs 'steps' new upgrade migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    private static scriptPath;
    static upgradeDatabase: (steps?: number) => Promise<void>;
    /**
     * Runs 'steps' downgrade migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static downgradeDatabase: (steps?: number) => Promise<void>;
}
//# sourceMappingURL=migrations.d.ts.map