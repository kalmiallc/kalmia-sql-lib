"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationHelper = void 0;
const kalmia_common_lib_1 = require("kalmia-common-lib");
const path = require("path");
const migrations_1 = require("../migrations/migrations");
class MigrationHelper {
    static setMigrationsPath(scriptPath) {
        MigrationHelper.scriptPath = scriptPath;
    }
    static setSeedsPath(scriptPath) {
        MigrationHelper.scriptPathSeed = scriptPath;
    }
}
exports.MigrationHelper = MigrationHelper;
_a = MigrationHelper;
/**
 * Runs 'steps' new upgrade migrations.
 *
 * @param steps How many migration steps to run. Defaults to all.
 */
MigrationHelper.scriptPath = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'migrations');
MigrationHelper.scriptPathSeed = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'seeds');
MigrationHelper.upgradeDatabase = async (steps = undefined, silent = true, thePath = MigrationHelper.scriptPath) => {
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
MigrationHelper.downgradeDatabase = async (steps = -1, silent = true, thePath = MigrationHelper.scriptPath) => {
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
MigrationHelper.seedDatabase = async (steps = undefined, silent = true, thePath = MigrationHelper.scriptPathSeed) => {
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
MigrationHelper.unseedDatabase = async (steps, silent = true, thePath = MigrationHelper.scriptPathSeed) => {
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
MigrationHelper.rebuildDatabase = async () => {
    await MigrationHelper.downgradeDatabase();
    await MigrationHelper.upgradeDatabase();
};
MigrationHelper.reSeedDatabase = async () => {
    await MigrationHelper.unseedDatabase(-1);
    await MigrationHelper.seedDatabase();
};
/**
 * Clears database by downgrading everything and re-running migrations.
 */
MigrationHelper.clearDatabase = async () => {
    await MigrationHelper.downgradeDatabase();
    await MigrationHelper.upgradeDatabase();
};
/**
 * Runs all downgrade migrations.
 */
MigrationHelper.dropDatabase = async () => {
    await MigrationHelper.downgradeDatabase();
};
//# sourceMappingURL=migrations.js.map