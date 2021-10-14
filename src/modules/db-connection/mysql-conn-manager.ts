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
import { IConnectionDetails } from '../../config/interfaces';
import { DbConnectionType } from '../../config/types';
import { env } from './../../config/env';

export class MySqlConnManager {
  private static instance: MySqlConnManager;
  private _connections: { [identifier: string]: mysql.Pool | mysql.Connection } = {};
  private _connectionsSync: { [identifier: string]: mysqlSync.Pool | mysqlSync.Connection } = {};
  private _connectionDetails: { [identifier: string]: IConnectionDetails } = {};
  private _connectionSyncDetails: { [identifier: string]: IConnectionDetails } = {};

  private constructor() {}

  /**
   * Gets MySqlConnectionManager instance
   *
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
      await conn.release();
    } catch (e) {
      throw new Error('Test pool connection unsuccessful!, ' + e);
    }
  }

  private static async testMySqlNoPoolConnection(mySqlConnection: mysql.Connection) {
    try {
      const conn = mySqlConnection;
      if ((conn as any).connection.stream.readyState !== 'open') {
        await conn.end();
        throw new Error('Test connection unsuccessful!');
      }
    } catch (e) {
      throw new Error('Test pool connection unsuccessful!, ' + e);
    }
  }

  /**
   * Provides database connection as pool assigned to identifier, defaulting to primary.
   *
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public async getConnection(databaseIdentifier: string = DbConnectionType.PRIMARY, config: mysql.ConnectionOptions = {}): Promise<mysql.Pool> {
    if (!this._connections[databaseIdentifier]) {
      this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
      this._connections[databaseIdentifier] = await this.getMySqlPoolConnection(config);
    }
    AppLogger.debug(
      'mysql-conn-manager.ts',
      'getConnection',
      'Returning pool connection from db manager for',
      databaseIdentifier,
      AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier])
    );
    return this._connections[databaseIdentifier] as mysql.Pool;
  }

  /**
   * Provides direct database connection (no pool) assigned to identifier, defaulting to primary.
   *
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public async getConnectionNoPool(
    databaseIdentifier: string = DbConnectionType.PRIMARY,
    config: mysql.ConnectionOptions = {}
  ): Promise<mysql.Connection> {
    if (!this._connections[databaseIdentifier]) {
      this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
      this._connections[databaseIdentifier] = await this.getMySqlNoPoolConnection(config);
    }
    AppLogger.debug(
      'mysql-conn-manager.ts',
      'getConnection',
      'Returning no pool connection from db manager for',
      databaseIdentifier,
      AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier])
    );
    return this._connections[databaseIdentifier] as mysql.Connection;
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
   *
   * @param databaseIdentifier (optional) identifier of database connection in question
   * @param config (optional) settings that can override the env settings.
   * @returns Sync connection
   */
  public getConnectionSync(databaseIdentifier: string = DbConnectionType.PRIMARY, config: mysql.ConnectionOptions = {}): mysqlSync.Pool {
    if (!this._connectionsSync[databaseIdentifier]) {
      this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
      this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
    }
    return this._connectionsSync[databaseIdentifier] as mysqlSync.Pool;
  }

  /**
   * Gets connection details for provided identifier
   *
   * @param databaseIdentifier (optional) identifier of database connection in question
   * @returns
   */
  public getConnectionDetails(databaseIdentifier: string = DbConnectionType.PRIMARY) {
    return this._connectionDetails[databaseIdentifier];
  }

  /**
   * Ends primary connection (pool -- closes all connections gracefully)
   *
   * @param databaseIdentifier (optional) identifier of database connection in question
   */
  public async end(databaseIdentifier: string = DbConnectionType.PRIMARY): Promise<any> {
    if (this._connectionsSync[databaseIdentifier]) {
      AppLogger.info(
        'mysql-conn-manager.ts',
        'end',
        'Ending connection mysql sync pool for',
        databaseIdentifier,
        AppLogger.stringifyObjectForLog(this._connectionSyncDetails[databaseIdentifier])
      );
      this._connectionsSync[databaseIdentifier].end();
      this._connectionsSync[databaseIdentifier] = null;
    }
    if (this._connections[databaseIdentifier]) {
      AppLogger.info(
        'mysql-conn-manager.ts',
        'end',
        'Ending connection mysql for',
        databaseIdentifier,
        AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier])
      );
      await (this._connections[databaseIdentifier] as any).end();
      this._connections[databaseIdentifier] = null;
      this._connectionDetails[databaseIdentifier] = null;
    }
  }

  /**
   * Ensures open connection to DB
   *
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
        poolSize: config.connectionLimit || env.MYSQL_POOL_SIZE_TEST
      };
    }

    return {
      database: config.database || env.MYSQL_DB,
      host: config.host || env.MYSQL_HOST,
      port: config.port || env.MYSQL_PORT,
      user: config.user || env.MYSQL_USER,
      poolSize: config.connectionLimit || env.MYSQL_POOL_SIZE
    };
  }

  private async getMySqlNoPoolConnection(config: mysqlSync.ConnectionOptions): Promise<mysql.Connection> {
    const { user, port, host, database, password } = this.setDbCredentials(config);
    AppLogger.debug('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] SQL Connection details:', env.APP_ENV, user, port, host, database);

    let conn;
    try {
      conn = await mysql.createConnection({
        ...config,
        host,
        port,
        database,
        password,
        user,
        connectTimeout: env.MYSQL_CONNECTION_TIMEOUT,
        decimalNumbers: true
      });
      await MySqlConnManager.testMySqlNoPoolConnection(conn);
      AppLogger.info(
        'mysql-conn-manager.ts',
        'getMySqlNoPoolConnection',
        `[DBM] Successfully created MySQL connection for ${host}:${port} | DatabaseName: ${database}`
      );
      return conn as mysql.Connection;
    } catch (e) {
      AppLogger.error('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] Database connection failed.', e);
      conn = null;
    }
  }

  private async getMySqlPoolConnection(config: mysql.ConnectionOptions = {}): Promise<mysql.Pool> {
    const { user, port, host, database, password } = this.setDbCredentials(config);

    AppLogger.debug('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] SQL Connection details:', env.APP_ENV, user, port, host, database);

    let conn;
    try {
      conn = await mysql.createPool({
        ...config,
        host,
        port,
        database,
        password,
        user,
        waitForConnections: true,
        connectTimeout: env.MYSQL_CONNECTION_TIMEOUT,
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

      // state listeners
      conn.on('acquire', function (connection) {
        AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Connection ${connection.threadId} acquired`);
      });
      conn.on('connection', function (connection) {
        connection.execute(`set session wait_timeout=${env.MYSQL_WAIT_TIMEOUT}`);
        const timeout = connection.execute('SELECT @@wait_timeout');
        AppLogger.debug(
          'mysql-conn-manager.ts',
          'testMySqlPoolConnection',
          'Connection wait timeout set to',
          AppLogger.stringifyObjectForLog(timeout[0])
        );
      });
      conn.on('release', function (connection) {
        AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Connection ${connection.threadId} release`);
      });
      conn.on('enqueue', function () {
        AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] Waiting for available connection slot');
      });

      return conn as mysql.Pool;
    } catch (e) {
      AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] Database connection failed.', e);
      conn = null;
    }
  }

  private setDbCredentials(config: mysqlSync.ConnectionOptions) {
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
    return { user, port, host, database, password, config };
  }

  private getMySqlConnectionSync(config?: mysqlSync.ConnectionOptions): mysqlSync.Pool {
    const { user, port, host, database, password } = this.setDbCredentials(config);

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
      `[DBM] Successfully created sync type MySQL pool for  ${host}:${port} | DatabaseName: ${database}`
    );
    return pool;
  }
}
