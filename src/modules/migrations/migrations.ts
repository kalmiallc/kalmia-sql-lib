import { Migration, MigrationConnection } from 'ts-mysql-migrate';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';

export interface MigrationOptions { path: string; tableName: string; silent: boolean }

export class Migrations {

  dbMigration: Migration;
  migrationToolConnectionPool;

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
  public async upgrade(steps: number = undefined) {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.up(steps);
  }
  public async downgrade(steps: number = -1) {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.down(steps);
  }
  public async clear() {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.down(-1);
  }
  public async rebuild() {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.reset();
  }
  public async setup() {
    if (!this.dbMigration) {
      throw new Error('Migration not initialized!');
    }
    await this.dbMigration.reset();
  }

}
