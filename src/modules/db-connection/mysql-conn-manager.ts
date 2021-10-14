/**
 * This is a global connection manager. It's purpose is to provide a single entry point for sql connections.
 * It allows only one instance, so this manager also handles connection pooling.
 *
 * Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connection pooling.
 * All the connection data needed is handled from the environment variables. These are defined in {@link ./../../config/env}
 *
 */

import { ApplicationEnv, AppLogger } from 'kalmia-common-lib';
import * as mysqlSync from 'mysql2';
import * as mysql from 'mysql2/promise';
import { env } from '../../config/env';
import { ConnectionStrategy, DbConnectionType, IConnectionDetails } from '../../config/types';

export class MySqlConnManager {
  private static instance: MySqlConnManager;
  private _connections: { [identifier: string]: mysql.Pool | mysql.Connection } = {};
  private _connectionsSync: { [identifier: string]: mysqlSync.Pool | mysqlSync.Connection } = {};
  private _connectionDetails: { [identifier: string]: IConnectionDetails } = {};
  private _connectionSyncDetails: { [identifier: string]: IConnectionDetails } = {};

  private constructor() {}

  /**
   * Gets MySqlConnectionManager instance
   * @param conn (optional) connection to set as primary
   * @returns MySqlConnectionManager instance
   */
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
      await conn.execute('set session wait_timeout=3600');

      await conn.release();
    } catch (e) {
      throw new Error('Test pool connection unsuccessful!, ' + e);
    }
  }

  /**
   * Provides database connection assigned to identifier, defaulting to primary.
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public async getConnection(
    databaseIdentifier: string = DbConnectionType.PRIMARY,
    config: mysql.ConnectionOptions = {}
  ): Promise<mysql.Pool | mysql.Connection> {
    if (!this._connections[databaseIdentifier]) {
      this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
      this._connections[databaseIdentifier] = await this.getMySqlConnection(config);
    }
    return this._connections[databaseIdentifier] as mysql.Pool;
  }

  /**
   * Sets database connection to primary identifier. User should ensure primary connection is closed beforehand.
   *
   */
  public setConnection(conn: mysql.Pool | mysql.Connection): mysql.Pool | mysql.Connection {
    this._connectionDetails[DbConnectionType.PRIMARY] = { database: DbConnectionType.PRIMARY };
    this._connections[DbConnectionType.PRIMARY] = conn;
    return this._connections[DbConnectionType.PRIMARY] as mysql.Pool;
  }

  /**
   * Primary connection in sync version. This can coexist with the async connection.
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public getConnectionSync(databaseIdentifier: string = DbConnectionType.PRIMARY): mysqlSync.Pool {
    if (!this._connectionsSync[databaseIdentifier]) {
      this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
      this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
    }
    return this._connectionsSync[databaseIdentifier] as mysqlSync.Pool;
  }

  /**
   * Gets connection details for provided identifier
   * @param databaseIdentifier (optional) identifier of database connection in question
   * @returns
   */
  public getConnectionDetails(databaseIdentifier: string = DbConnectionType.PRIMARY) {
    return this._connectionDetails[databaseIdentifier];
  }

  /**
   * Ends primary connection (pool -- closes all connections gracefully)
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public async end(databaseIdentifier: string = DbConnectionType.PRIMARY): Promise<any> {
    if (this._connectionsSync[databaseIdentifier]) {
      AppLogger.info(
        'mysql-conn-manager.ts',
        'end',
        'Ending connection mysql sync pool',
        AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier])
      );
      this._connectionsSync[databaseIdentifier].end();
      delete this._connectionsSync[databaseIdentifier];
    }
    if (this._connections[databaseIdentifier]) {
      AppLogger.info(
        'mysql-conn-manager.ts',
        'end',
        'Ending connection mysql pool',
        AppLogger.stringifyObjectForLog(this._connectionSyncDetails[databaseIdentifier])
      );
      await (this._connections[databaseIdentifier] as mysql.Pool).end();
      delete this._connections[databaseIdentifier];
      delete this._connectionDetails[databaseIdentifier];
    }
  }

  /**
   * Ensures open connection to DB
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public async ensureAliveSql(databaseIdentifier: string = DbConnectionType.PRIMARY, conn?: mysql.PoolConnection): Promise<void> {
    if (!this._connections[databaseIdentifier]) {
      await (this._connections[databaseIdentifier] as mysql.Connection).connect();
      return;
    }
    try {
      if (!conn) {
        conn = await (this._connections[databaseIdentifier] as mysql.Pool).getConnection();
      }

      if (!conn || (conn as any).connection.stream.readyState !== 'open') {
        this._connections[databaseIdentifier] = undefined;
        await (this._connections[databaseIdentifier] as mysql.Connection).connect();
      }
    } catch (err) {
      this._connections[databaseIdentifier] = undefined;
      await (this._connections[databaseIdentifier] as mysql.Connection).connect();
    }
  }

  private populateDetails(config: mysql.ConnectionOptions = {}): IConnectionDetails {
    if (process.env.APP_ENV === ApplicationEnv.TEST) {
      return {
        database: config.database || env.MYSQL_DB_TEST,
        host: config.host || env.MYSQL_HOST_TEST,
        port: config.port || env.MYSQL_PORT_TEST,
        user: config.user || env.MYSQL_USER_TEST,
        poolSize: config.connectionLimit || env.MYSQL_POOL_SIZE_TEST,
        strategy: ConnectionStrategy[process.env.MYSQL_CONN_STRATEGY] || ConnectionStrategy.LOCAL_POOL
      };
    }

    return {
      database: config.database || env.MYSQL_DB,
      host: config.host || env.MYSQL_HOST,
      port: config.port || env.MYSQL_PORT,
      user: config.user || env.MYSQL_USER,
      poolSize: config.connectionLimit || env.MYSQL_POOL_SIZE,
      strategy: ConnectionStrategy[process.env.MYSQL_CONN_STRATEGY] || ConnectionStrategy.LOCAL_POOL
    };
  }

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
      AppLogger.info(
        'mysql-conn-manager.ts',
        'getMySqlLocalPoolConnection',
        `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`
      );
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
    AppLogger.info(
      'mysql-conn-manager.ts',
      'getMySqlConnectionSync',
      `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`
    );
    return pool;
  }
}
