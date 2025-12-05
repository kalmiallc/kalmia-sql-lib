"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationHelper = void 0;
const kalmia_common_lib_1 = require("kalmia-common-lib");
const path = require("path");
const migrations_1 = require("../migrations/migrations");
class MigrationHelper {
    /**
     * Runs 'steps' new upgrade migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static scriptPath = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'migrations');
    static scriptPathSeed = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'seeds');
    static setMigrationsPath(scriptPath) {
        MigrationHelper.scriptPath = scriptPath;
    }
    static setSeedsPath(scriptPath) {
        MigrationHelper.scriptPathSeed = scriptPath;
    }
    static upgradeDatabase = async (steps = undefined, silent = true, thePath = MigrationHelper.scriptPath) => {
        const migration = new migrations_1.Migrations();
        kalmia_common_lib_1.AppLogger.info('migrations.ts', 'Upgrade database', 'Running migrations for ' + thePath);
        await migration.init({
            tableName: 'migrations',
            silent,
            path: thePath
        });
        if (steps == -1) {
            await migration.downgrade();
            return;
        }
        await migration.upgrade(steps);
    };
    /**
     * Runs 'steps' downgrade migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static downgradeDatabase = async (steps = -1, silent = true, thePath = MigrationHelper.scriptPath) => {
        const migration = new migrations_1.Migrations();
        await migration.init({
            tableName: 'migrations',
            silent,
            path: thePath
        });
        if (steps == -1) {
            await migration.downgrade();
            return;
        }
        await migration.downgrade(steps);
    };
    /**
     * Runs 'steps' new seed migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static seedDatabase = async (steps = undefined, silent = true, thePath = MigrationHelper.scriptPathSeed) => {
        const migration = new migrations_1.Migrations();
        kalmia_common_lib_1.AppLogger.info('migrations.ts', 'Seeding database', 'Running migrations seed for ' + thePath);
        await migration.init({
            tableName: 'seeds',
            silent,
            path: thePath
        });
        await migration.upgrade(steps);
    };
    /**
     * Runs 'steps' unseed migrations.
     *
     * @param steps How many migration steps to run. Defaults to all.
     */
    static unseedDatabase = async (steps, silent = true, thePath = MigrationHelper.scriptPathSeed) => {
        const migration = new migrations_1.Migrations();
        await migration.init({
            tableName: 'seeds',
            silent,
            path: thePath
        });
        await migration.downgrade(steps);
    };
    /**
     * Rebuilds database by downgrading everything and re-running migrations.
     */
    static rebuildDatabase = async () => {
        await MigrationHelper.downgradeDatabase();
        await MigrationHelper.upgradeDatabase();
    };
    static reSeedDatabase = async () => {
        await MigrationHelper.unseedDatabase(-1);
        await MigrationHelper.seedDatabase();
    };
    /**
     * Clears database by downgrading everything and re-running migrations.
     */
    static clearDatabase = async () => {
        await MigrationHelper.downgradeDatabase();
        await MigrationHelper.upgradeDatabase();
    };
    /**
     * Runs all downgrade migrations.
     */
    static dropDatabase = async () => {
        await MigrationHelper.downgradeDatabase();
    };
}
exports.MigrationHelper = MigrationHelper;
//# sourceMappingURL=migrations.js.map