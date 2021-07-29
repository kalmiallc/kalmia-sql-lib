import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { ApplicationEnv } from '../../config/types';
import { env } from '../../config/env';
import { Connection, Pool } from 'mysql2/promise';
import { MySqlUtil } from '../db-connection/mysql-util';

/**
 * Testing MySQL stage class.
 */
export class MySqlStage {
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
