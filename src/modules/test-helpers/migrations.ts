import { AppLogger } from 'kalmia-common-lib';
import * as path from 'path';
import { Migrations } from '../migrations/migrations';

export class MigrationHelper {
  /**
   * Runs 'steps' new upgrade migrations.
   *
   * @param steps How many migration steps to run. Defaults to all.
   */

  private static scriptPath = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'migrations');
  private static scriptPathSeed = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'seeds');

  static upgradeDatabase = async (steps: number = undefined, silent = true, thePath = this.scriptPath): Promise<void> => {
    const migration = new Migrations();
    AppLogger.info('migrations.ts', 'Upgrade database', 'Running migrations for ' + thePath);
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
  static downgradeDatabase = async (steps: number = -1, silent = true, thePath = this.scriptPath): Promise<void> => {
    const migration = new Migrations();
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
  static seedDatabase = async (steps: number = undefined, silent = true, thePath = this.scriptPathSeed): Promise<void> => {
    const migration = new Migrations();
    AppLogger.info('migrations.ts', 'Seeding database', 'Running migrations seed for ' + thePath);
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
  static unseedDatabase = async (steps: number, silent = true, thePath = this.scriptPathSeed): Promise<void> => {
    const migration = new Migrations();

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
  static rebuildDatabase = async (): Promise<void> => {
    await MigrationHelper.downgradeDatabase();
    await MigrationHelper.upgradeDatabase();
  };

  static reSeedDatabase = async (): Promise<void> => {
    await MigrationHelper.unseedDatabase(-1);
    await MigrationHelper.seedDatabase();
  };

  /**
   * Clears database by downgrading everything and re-running migrations.
   */
  static clearDatabase = async (): Promise<void> => {
    await MigrationHelper.downgradeDatabase();
    await MigrationHelper.upgradeDatabase();
  };

  /**
   * Runs all downgrade migrations.
   */
  static dropDatabase = async (): Promise<void> => {
    await MigrationHelper.downgradeDatabase();
  };
}
