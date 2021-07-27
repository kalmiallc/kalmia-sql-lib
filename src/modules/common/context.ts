import { MySqlUtil } from '../db-connection/mysql-util';

/**
 * Request context with additional request information.
 */
export class Context {
  public mysql: MySqlUtil;
  public user: any;
  public appSecret: string;

  /**
   * Context class constructor.
   *
   * @param env Application env.
   * @param mongo Connected MongoDB instance
   */
  public constructor(appSecret: string, mysql?: MySqlUtil) {
    this.appSecret = appSecret;
    this.mysql = mysql;
  }

  /**
   * Sets MySql database connection to context
   *
   * @param mysql MySql connection object
   */
  public setMySql(mysql: MySqlUtil): void {
    this.mysql = mysql;
  }
}
