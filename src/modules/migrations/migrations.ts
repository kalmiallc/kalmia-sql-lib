import { Migration, MigrationConnection } from 'ts-mysql-migrate';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';

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
export class Migrations {
  dbMigration: Migration;
  migrationToolConnectionPool;

  /**
   * Initialized migration options. This should be called first
   * @param options parameters for initialization
   */
  public async init(options: MigrationOptions) {
    this.migrationToolConnectionPool = MySqlConnManager.getInstance().getConnectionSync();

    this.dbMigration = new Migration({
      conn: this.migrationToolConnectionPool as any as MigrationConnection,
      tableName: options.tableName,
      dir: options.path,
      silent: options.silent
    });

    await this.dbMigration.initialize();
  }

  /**
   * Upgrades migrations by number of steps. If not provided, runs all migrations that have not yet been run.
   * @param steps (optional) number of steps to upgrade by
   */
  public async upgrade(steps: number = undefined) {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.up(steps);
  }

  /**
   * Downgrades migrations by number of steps. If not provided, downgrades completely.
   * @param steps (optional) number of steps to downgrade by
   */
  public async downgrade(steps: number = -1) {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.down(steps);
  }

  /**
   * Runs all downgrade migrations
   */
  public async clear() {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.down(-1);
  }

  /**
   * Resets migration database. Runs all down migrations, then all up migrations.
   */
  public async rebuild() {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.reset();
  }

  /**
   * Sets up database. If already set up, resets database.
   */
  public async setup() {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.reset();
  }
}
