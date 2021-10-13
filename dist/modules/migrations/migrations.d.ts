import { Migration } from 'ts-mysql-migrate';
/**
 * Migration options
 */
export interface MigrationOptions {
    /**
     * Path to migration files. Should be made with path.join, starting with __dirname.
     */
    path: string;
    /**
     * Name of database table migrations should be saved to. Should be unique for every package.
     */
    tableName: string;
    silent: boolean;
}
/**
 * General class for handling migrations. It uses ts-mysql-migrate tool for handling migrations.
 * @link https://github.com/tinemlakar/ts-mysql-migrate
 */
export declare class Migrations {
    dbMigration: Migration;
    migrationToolConnectionPool: any;
    /**
     * Initialized migration options. This should be called first
     * @param options parameters for initialization
     */
    init(options: MigrationOptions): Promise<void>;
    /**
     * Upgrades migrations by number of steps. If not provided, runs all migrations that have not yet been run.
     * @param steps (optional) number of steps to upgrade by
     */
    upgrade(steps?: number): Promise<void>;
    /**
     * Downgrades migrations by number of steps. If not provided, downgrades completely.
     * @param steps (optional) number of steps to downgrade by
     */
    downgrade(steps?: number): Promise<void>;
    /**
     * Runs all downgrade migrations
     */
    clear(): Promise<void>;
    /**
     * Resets migration database. Runs all down migrations, then all up migrations.
     */
    rebuild(): Promise<void>;
    /**
     * Sets up database. If already set up, resets database.
     */
    setup(): Promise<void>;
}
//# sourceMappingURL=migrations.d.ts.map