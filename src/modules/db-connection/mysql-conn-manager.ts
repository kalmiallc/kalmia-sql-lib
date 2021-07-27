/**
 * This is a global connection manager. It's purpose is to provide a single entry point for all types of connections.
 * It allows only one instance, so this manager also handles connection pooling.
 *
 * Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connection pooling.
 * All the connection data needed is handled from the environment variables. These are defined in {@link ./../../config/env}
 *
 *
 * 
 * TODO: Add options to control the connection from the AWS
 */

import * as mysqlSync from 'mysql2';
import * as mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';
import { env } from '../../config/env';
import { ApplicationEnv, ConnectionStrategy, DbConnectionType, DbType, IConnectionDetails } from '../../config/types';
import { AppLogger } from '../logger/app-logger';


export class MySqlConnManager {
  private static instance: MySqlConnManager;
  private _connections: {[identifier: string]: mysql.Pool | mysql.Connection} = {};
  private _connectionsSync: {[identifier: string]: mysqlSync.Pool | mysqlSync.Connection} = {};
  private _connectionDetails: {[identifier: string]: IConnectionDetails} = {};

  private constructor() {}

  public static getInstance(conn?: mysql.Pool | mysql.Connection) {
    if (!MySqlConnManager.instance) {
      MySqlConnManager.instance = new MySqlConnManager();
    }
    if (conn) {
      MySqlConnManager.instance.setConnection(conn);
    }
    return MySqlConnManager.instance;
  }

  private static async testMySqlPoolConnection(mySqlConnection: mysql.Pool) {
    try {
      const conn = await mySqlConnection.getConnection();
      if ((conn as any).connection.stream.readyState !== 'open') {
        await conn.release();
        throw new Error('Test pool connection unsuccessful!');
      }
      await conn.release();
    } catch (e) {
      throw new Error('Test pool connection unsuccessful!, ' + e);
    }
  }

  /**
   * Provides primary database connection.
   *
   */
  public async getConnection(database: string = DbConnectionType.PRIMARY, config: mysql.ConnectionOptions = {}): Promise<mysql.Pool | mysql.Connection> {
    if (!this._connections[database]) {
      this._connectionDetails[database] = this.populateDetails(config);
      this._connections[database] = await this.getMySqlConnection(config);
    }
    return this._connections[database] as Pool;
  }

  /**
   * Provides primary database connection.
   *
   */
  public setConnection(conn: mysql.Pool | mysql.Connection): mysql.Pool | mysql.Connection {
    this._connectionDetails[DbConnectionType.PRIMARY] = {database: DbConnectionType.PRIMARY, type: DbType.MYSQL};
    this._connections[DbConnectionType.PRIMARY] = conn;
    return this._connections[DbConnectionType.PRIMARY] as Pool;
  }

  /**
   * Primary connection in sync version. This can coexist with the async connection.
   *
   */
  public getConnectionSync(database: string = DbConnectionType.PRIMARY): mysqlSync.Pool {
    if (!this._connectionsSync[database]) {
      this._connectionsSync[database] = this.getMySqlConnectionSync();
    }
    return this._connectionsSync[database] as mysqlSync.Pool;
  }

  public getConnectionDetails(database: string = DbConnectionType.PRIMARY) {
    return this._connectionDetails[database];
  }

  /**
   * Ends primary connection (pool -- closes all connections gracefully)
   */
  public async end(database: string = DbConnectionType.PRIMARY): Promise<any> {
    if (this._connectionsSync[database]) {
      AppLogger.info('mysql-conn-manager.ts', 'end', 'Ending primary connection mysql sync pool', AppLogger.stringifyObjectForLog(this._connectionDetails[database]));
      this._connectionsSync[database].end();
      delete this._connectionsSync[database];
    }
    if (this._connections[database]) {
      AppLogger.info('mysql-conn-manager.ts', 'end', 'Ending primary connection mysql pool', AppLogger.stringifyObjectForLog(this._connectionDetails[database]));
      await (this._connections[database] as mysql.Pool).end();
      delete this._connections[database];
      delete this._connectionDetails[database];
    }
  }

  /**
   * Ensures open connection to DB
   *
   */
  public async ensureAliveSql(database: string = DbConnectionType.PRIMARY, conn?: mysql.PoolConnection): Promise<void> {
    if (!this._connections[database]) {
      await (this._connections[database] as mysql.Connection).connect();
      return;
    }
    try {
      if (!conn) {
        conn = await (this._connections[database] as mysql.Pool).getConnection();
      }

      if (!conn || (conn as any).connection.stream.readyState !== 'open') {
        this._connections[database] = undefined;
        await (this._connections[database] as mysql.Connection).connect();
      }
    } catch (err) {
      this._connections[database] = undefined;
      await (this._connections[database] as mysql.Connection).connect();
    }
  }

  private populateDetails(config: mysql.ConnectionOptions = {}): IConnectionDetails {
    if (process.env.APP_ENV === ApplicationEnv.TEST) {
      return {
        type: DbType.MYSQL,
        database: config.database || env.MYSQL_DB_TEST,
        host: config.host || env.MYSQL_HOST_TEST,
        port: config.port || env.MYSQL_PORT_TEST,
        user: config.user || env.MYSQL_USER_TEST,
        poolSize: config.connectionLimit || env.MYSQL_POOL_SIZE_TEST,
        strategy: ConnectionStrategy[process.env.MYSQL_CONN_STRATEGY] || ConnectionStrategy.LOCAL_POOL
      };
    }

    return {
      type: DbType.MYSQL,
      database: config.database || env.MYSQL_DB,
      host: config.host || env.MYSQL_HOST,
      port: config.port || env.MYSQL_PORT,
      user: config.user || env.MYSQL_USER,
      poolSize: config.connectionLimit || env.MYSQL_POOL_SIZE,
      strategy: ConnectionStrategy[process.env.MYSQL_CONN_STRATEGY] || ConnectionStrategy.LOCAL_POOL
    };
  }

  // #region SQL
  private async getMySqlConnection(config: mysql.ConnectionOptions = {}): Promise<mysql.Pool | mysql.Connection> {
    return await this.getMySqlLocalPoolConnection(config);
    // TODO: Handle AWS RDS, no poll....
  }

  private async getMySqlLocalPoolConnection(config: mysql.ConnectionOptions = {}): Promise<mysql.Pool> {
    if (!config) {
      config = {};
    }
    let host = config.host || env.MYSQL_HOST;
    let port = config.port || env.MYSQL_PORT;
    let database = config.database || env.MYSQL_DB;
    let user = config.user || env.MYSQL_USER;
    let password = config.password || env.MYSQL_PASSWORD;

    // connect to test DB is APP_ENV variable is set to testing.
    if (env.APP_ENV === ApplicationEnv.TEST) {
      host = config.host || env.MYSQL_HOST_TEST;
      port = config.port || env.MYSQL_PORT_TEST;
      database = config.database || env.MYSQL_DB_TEST;
      user = config.user || env.MYSQL_USER_TEST;
      password = config.password || env.MYSQL_PASSWORD_TEST;
    }

    AppLogger.debug('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] SQL Connection details:', env.APP_ENV, user, port, host, database);
    let conn;
    try {
      conn = await mysql.createPool({
        host,
        port,
        database,
        password,
        user,
        waitForConnections: true,
        decimalNumbers: true,
        connectionLimit: config.connectionLimit || env.MYSQL_POOL_SIZE,
        queueLimit: 100
      });
      await MySqlConnManager.testMySqlPoolConnection(conn);
      AppLogger.info('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
      return conn as mysql.Pool;
    } catch (e) {
      AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] Database connection failed.', e);
      conn = null;
    }
  }

  private getMySqlConnectionSync(): mysqlSync.Pool {
    let host = env.MYSQL_HOST;
    let port = env.MYSQL_PORT;
    let database = env.MYSQL_DB;
    let user = env.MYSQL_USER;
    let password = env.MYSQL_PASSWORD;

    // connect to test DB is APP_ENV variable is set to testing.
    if (env.APP_ENV === ApplicationEnv.TEST) {
      host = env.MYSQL_HOST_TEST;
      port = env.MYSQL_PORT_TEST;
      database = env.MYSQL_DB_TEST;
      user = env.MYSQL_USER_TEST;
      password = env.MYSQL_PASSWORD_TEST;
    }

    const poolConfig: mysqlSync.ConnectionOptions = {
      host,
      port,
      user,
      password,
      database,
      // debug: true,
      connectionLimit: 10
    };
    const pool = mysqlSync.createPool(poolConfig);
    AppLogger.info('mysql-conn-manager.ts', 'getMySqlConnectionSync', `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
    return pool;
  }

  // #endregion

}
