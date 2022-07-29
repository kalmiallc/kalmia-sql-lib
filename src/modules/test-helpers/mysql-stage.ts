import { ApplicationEnv } from 'kalmia-common-lib';
import { Connection, Pool } from 'mysql2/promise';
import { env } from '../../config/env';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { MySqlUtil } from '../db-connection/mysql-util';

/**
 * Testing MySQL stage class.
 */
class MySqlStage {
  private static instance: MySqlStage;
  public connManager: MySqlConnManager;
  public dbConn: Pool | Connection;
  public utils: MySqlUtil;

  public constructor() {}

  public static async getInstance(): Promise<MySqlStage> {
    if (!MySqlStage.instance) {
      MySqlStage.instance = new MySqlStage();
      await MySqlStage.instance.init();
    }

    return MySqlStage.instance;
  }

  /**
   * MySQL testing environment init function.
   */
  public async init(): Promise<void> {
    env.APP_ENV = ApplicationEnv.TEST;
    this.connManager = MySqlConnManager.getInstance();
    this.dbConn = await this.connManager.getConnection();
    this.utils = new MySqlUtil(this.dbConn);
  }

  /**
   * Closes MySQL connection.
   */
  public async close(): Promise<void> {
    await this.connManager.end();
  }
}

async function setupDatabase() {
  const conn = (await MySqlConnManager.getInstance().getConnection()) as Pool;
  const mysqlLoc = new MySqlUtil(conn);
  await mysqlLoc.paramExecute(
    `
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `,
    {}
  );
}

async function dropDatabase() {
  const conn = (await MySqlConnManager.getInstance().getConnection()) as Pool;
  const mysqlLoc = new MySqlUtil(conn);
  await mysqlLoc.paramExecute(
    `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `,
    {}
  );
}

async function cleanDatabase() {
  await dropDatabase();
  await setupDatabase();
}

export { MySqlStage, setupDatabase, dropDatabase, cleanDatabase };
