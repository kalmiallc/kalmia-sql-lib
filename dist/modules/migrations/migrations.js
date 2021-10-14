"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrations = void 0;
const ts_mysql_migrate_1 = require("ts-mysql-migrate");
const mysql_conn_manager_1 = require("../db-connection/mysql-conn-manager");
/**
 * General class for handling migrations. It uses ts-mysql-migrate tool for handling migrations.
 *
 * @link https://github.com/tinemlakar/ts-mysql-migrate
 */
class Migrations {
    /**
     * Initialized migration options. This should be called first
     *
     * @param options parameters for initialization
     */
    async init(options) {
        this.migrationToolConnectionPool = mysql_conn_manager_1.MySqlConnManager.getInstance().getConnectionSync();
        this.dbMigration = new ts_mysql_migrate_1.Migration({
            conn: this.migrationToolConnectionPool,
            tableName: options.tableName,
            dir: options.path,
            silent: options.silent
        });
        await this.dbMigration.initialize();
    }
    /**
     * Upgrades migrations by number of steps. If not provided, runs all migrations that have not yet been run.
     *
     * @param steps (optional) number of steps to upgrade by
     */
    async upgrade(steps = undefined) {
        if (!this.dbMigration) {
            throw new Error('Migration not initialized!');
        }
        await this.dbMigration.up(steps);
    }
    /**
     * Downgrades migrations by number of steps. If not provided, downgrades completely.
     *
     * @param steps (optional) number of steps to downgrade by
     */
    async downgrade(steps = -1) {
        if (!this.dbMigration) {
            throw new Error('Migration not initialized!');
        }
        await this.dbMigration.down(steps);
    }
    /**
     * Runs all downgrade migrations
     */
    async clear() {
        if (!this.dbMigration) {
            throw new Error('Migration not initialized!');
        }
        await this.dbMigration.down(-1);
    }
    /**
     * Resets migration database. Runs all down migrations, then all up migrations.
     */
    async rebuild() {
        if (!this.dbMigration) {
            throw new Error('Migration not initialized!');
        }
        await this.dbMigration.reset();
    }
    /**
     * Sets up database. If already set up, resets database.
     */
    async setup() {
        if (!this.dbMigration) {
            throw new Error('Migration not initialized!');
        }
        await this.dbMigration.reset();
    }
}
exports.Migrations = Migrations;
//# sourceMappingURL=migrations.js.map