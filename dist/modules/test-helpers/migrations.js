"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationHelper = void 0;
const path = require("path");
const migrations_1 = require("../migrations/migrations");
class MigrationHelper {
}
exports.MigrationHelper = MigrationHelper;
_a = MigrationHelper;
/**
 * Runs 'steps' new upgrade migrations.
 *
 * @param steps How many migration steps to run. Defaults to all.
 */
MigrationHelper.scriptPath = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'migrations');
MigrationHelper.upgradeDatabase = async (steps = undefined) => {
    const migration = new migrations_1.Migrations();
    await migration.init({
        tableName: 'migrations',
        silent: true,
        path: _a.scriptPath
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
MigrationHelper.downgradeDatabase = async (steps = -1) => {
    const migration = new migrations_1.Migrations();
    await migration.init({
        tableName: 'migrations',
        silent: true,
        path: _a.scriptPath
    });
    if (steps == -1) {
        await migration.downgrade();
        return;
    }
    await migration.downgrade(steps);
};
//# sourceMappingURL=migrations.js.map