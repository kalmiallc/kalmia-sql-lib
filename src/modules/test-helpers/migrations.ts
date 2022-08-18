import * as path from 'path';
import { Migrations } from '../migrations/migrations';

export class MigrationHelper {
  /**
   * Runs 'steps' new upgrade migrations.
   *
   * @param steps How many migration steps to run. Defaults to all.
   */

  private static scriptPath = path.join(__dirname, '..', '..', '..', 'src', 'migration-scripts', 'migrations');

  static upgradeDatabase = async (steps: number = undefined): Promise<void> => {
    const migration = new Migrations();

    await migration.init({
      tableName: 'migrations',
      silent: true,
      path: this.scriptPath
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
  static downgradeDatabase = async (steps: number = -1): Promise<void> => {
    const migration = new Migrations();
    await migration.init({
      tableName: 'migrations',
      silent: true,
      path: this.scriptPath
    });

    if (steps == -1) {
      await migration.downgrade();
      return;
    }

    await migration.downgrade(steps);
  };
}
