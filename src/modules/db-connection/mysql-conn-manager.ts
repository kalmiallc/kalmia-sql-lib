/**
 * This is a global connection manager. It's purpose is to provide a single entry point for sql connections.
 * It allows only one instance, so this manager also handles connection pooling.
 *
 * Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connection pooling.
 * All the connection data needed is handled from the environment variables. These are defined in {@link ./../../config/env}
 *
 */
import * as fs from 'fs';
import { ApplicationEnv, AppLogger } from 'kalmia-common-lib';
import * as mysqlSync from 'mysql2';
import * as mysql from 'mysql2/promise';
import * as path from 'path';
import { IConnectionDetails } from '../../config/interfaces';
import { DbConnectionType } from '../../config/types';
import { env } from './../../config/env';

export class MySqlConnManager {
  private static instance: MySqlConnManager;
  private static _openConnections = [];
  private static _poolConnCloseListeners = [];
  private static _poolConnOpenListeners = [];
  private _connections: { [identifier: string]: mysql.Pool | mysql.Connection } = {};
  private _connectionsSync: { [identifier: string]: mysqlSync.Pool | mysqlSync.Connection } = {};
  private _connectionDetails: { [identifier: string]: IConnectionDetails } = {};
  private _connectionSyncDetails: { [identifier: string]: IConnectionDetails } = {};

  private constructor() {}

  /**
   * Test if connection pool is not closed
   *
   * @param mySqlConnection
   *
   * @returns
   */
  public static async testDirectPoolConnection(mySqlConnection: mysql.Pool) {
    // If connection is not defined, return true, as we ship the check
    if (!mySqlConnection || mySqlConnection === undefined || mySqlConnection === null) {
      return true;
    }

    try {
      await mySqlConnection?.execute('SELECT 1;');
      return true;
    } catch (e) {
      AppLogger.warn('mysql-conn-manager.ts', 'testDirectPoolConnection', 'Pool connection closed, it will probably be reinitialized');
      return false;
    }
  }

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

  public static updateEnv(newEnv: any) {
    Object.assign(env, newEnv);
  }

  public static addConnOpenListener(listener: (conn: mysql.PoolConnection | mysql.Connection) => void) {
    MySqlConnManager._poolConnOpenListeners.push(listener);
  }

  public static addConnCloseListener(listener: (conn: any) => void) {
    MySqlConnManager._poolConnCloseListeners.push(listener);
  }

  private static async testMySqlCon(mySqlConnection: mysql.Pool) {
    try {
      const conn = await mySqlConnection.getConnection();
      if ((conn as any).connection.stream.readyState !== 'open') {
        await conn.release();
        throw new Error('Connection created form pool is not open!');
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
   * @param config (optional) connection config
   */
  public async getConnection(databaseIdentifier: string = DbConnectionType.PRIMARY, config: mysql.ConnectionOptions = {}): Promise<mysql.Pool> {
    if (!this._connections[databaseIdentifier]) {
      this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
      this._connections[databaseIdentifier] = await this.getMySqlPoolConnection(config);
    }

    try {
      const isAlive = await MySqlConnManager.testDirectPoolConnection(this._connections[databaseIdentifier] as mysql.Pool);
      if (!isAlive) {
        await this.reinitializeConnection(databaseIdentifier, config);
      }
    } catch (e) {
      console.error('Error testing connection', e);
    }

    AppLogger.db(
      'mysql-conn-manager.ts',
      'getConnection',
      'Returning pool connection from db manager for',
      databaseIdentifier,
      AppLogger.stringifyObjectForLog({
        ...this._connectionDetails[databaseIdentifier],
        ssl: this._connectionDetails[databaseIdentifier].ssl ? '***' : undefined
      })
    );

    // await this.reinitializeConnection(databaseIdentifier, config);
    return this._connections[databaseIdentifier] as mysql.Pool;
  }

  /** *
   * Re-Initializes connection
   *
   * @param databaseIdentifier (optional) identifier of database connection in question
   * @param config (optional) connection config
   */

  public async reinitializeConnection(
    databaseIdentifier: string = DbConnectionType.PRIMARY,
    config: mysql.ConnectionOptions = {}
  ): Promise<mysql.Pool> {
    this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
    this._connections[databaseIdentifier] = await this.getMySqlPoolConnection(config);
    AppLogger.db(
      'mysql-conn-manager.ts',
      'getConnection',
      'Connection reinitialized',
      databaseIdentifier,
      AppLogger.stringifyObjectForLog({
        ...this._connectionDetails[databaseIdentifier],
        ssl: this._connectionDetails[databaseIdentifier].ssl ? '***' : undefined
      })
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
    AppLogger.db(
      'mysql-conn-manager.ts',
      'getConnection',
      'Returning no pool connection from db manager for',
      databaseIdentifier,
      AppLogger.stringifyObjectForLog({
        ...this._connectionDetails[databaseIdentifier],
        ssl: this._connectionDetails[databaseIdentifier].ssl ? '***' : undefined
      })
    );
    return this._connections[databaseIdentifier] as mysql.Connection;
  }

  public getActiveConnections() {
    return MySqlConnManager._openConnections;
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
  public getConnectionSync(databaseIdentifier: string = DbConnectionType.PRIMARY): mysqlSync.Pool {
    if (!this._connectionsSync[databaseIdentifier]) {
      this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
      this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
    }
    return this._connectionsSync[databaseIdentifier] as mysqlSync.Pool;
  }

  public reinitializeConnectionSync(databaseIdentifier: string = DbConnectionType.PRIMARY): mysqlSync.Pool {
    this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
    this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
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
    if (this._connections[databaseIdentifier]) {
      AppLogger.db(
        'mysql-conn-manager.ts',
        'end',
        'Ending connection mysql for',
        databaseIdentifier,
        AppLogger.stringifyObjectForLog({
          ...(this._connections[databaseIdentifier] as any).pool?.config?.connectionConfig,
          ...(this._connections[databaseIdentifier] as any).config
        })
      );
      try {
        await (this._connections[databaseIdentifier] as any).end();
      } catch (e) {
        AppLogger.warn('mysql-conn-manager.ts', 'end', 'Error ending connection', e);
      }
      this._connections[databaseIdentifier] = null;
      this._connectionDetails[databaseIdentifier] = null;
      MySqlConnManager._openConnections = [];
    }
  }

  public endSync(databaseIdentifier: string = DbConnectionType.PRIMARY): any {
    if (this._connectionsSync[databaseIdentifier]) {
      AppLogger.db(
        'mysql-conn-manager.ts',
        'end',
        'Ending connection mysql sync pool for',
        databaseIdentifier,
        AppLogger.stringifyObjectForLog({
          ...(this._connectionsSync[databaseIdentifier] as any)?.config?.connectionConfig
        })
      );
      this._connectionsSync[databaseIdentifier].end();
      this._connectionsSync[databaseIdentifier] = null;
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
        // ssl: this.getSslParams()
      };
    }

    return {
      database: config.database || env.MYSQL_DB,
      host: config.host || env.MYSQL_HOST,
      port: config.port || env.MYSQL_PORT,
      user: config.user || env.MYSQL_USER,
      poolSize: config?.connectionLimit || env.MYSQL_POOL_SIZE,
      ssl: this.getSslParams()
    };
  }

  private getSslParams() {
    if (!env.MYSQL_SSL_CA_FILE) {
      return undefined;
    } else {
      return {
        ca: fs.readFileSync(path.resolve(process.cwd(), env.MYSQL_SSL_CA_FILE)).toString(),
        key: env.MYSQL_SSL_KEY_FILE ? fs.readFileSync(path.resolve(process.cwd(), env.MYSQL_SSL_KEY_FILE)).toString() : undefined,
        cert: env.MYSQL_SSL_CERT_FILE ? fs.readFileSync(path.resolve(process.cwd(), env.MYSQL_SSL_CERT_FILE)).toString() : undefined
      };
    }
  }

  private async getMySqlNoPoolConnection(config: mysqlSync.ConnectionOptions): Promise<mysql.Connection> {
    const { user, port, host, database, password, ssl } = this.setDbCredentials(config);
    AppLogger.db('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] SQL Connection details:', env.APP_ENV, user, port, host, database);

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
        debug: env.MYSQL_DEBUG,
        timezone: env.MYSQL_TIMEZONE,
        decimalNumbers: true,
        ssl
      });
      await MySqlConnManager.testMySqlNoPoolConnection(conn);
      AppLogger.db(
        'mysql-conn-manager.ts',
        'getMySqlNoPoolConnection',
        `[DBM] Successfully created MySQL connection for ${host}:${port} | DatabaseName: ${database}`
      );
      MySqlConnManager._openConnections.push(conn);
      return conn as mysql.Connection;
    } catch (e) {
      AppLogger.error('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] Database connection failed.', e);
      conn = null;
    }
  }

  private async getMySqlPoolConnection(config: mysql.ConnectionOptions = {}): Promise<mysql.Pool> {
    const { user, port, host, database, password, ssl } = this.setDbCredentials(config);

    AppLogger.db('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] SQL Connection details:', env.APP_ENV, user, port, host, database);

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
        connectionLimit: config?.connectionLimit || env.MYSQL_POOL_SIZE,
        queueLimit: 100,
        timezone: env.MYSQL_TIMEZONE,
        ssl
      });
      await MySqlConnManager.testMySqlCon(conn);
      AppLogger.info(
        'mysql-conn-manager.ts',
        'getMySqlLocalPoolConnection',
        `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`
      );

      // state listeners
      conn.on('acquire', function (connection) {
        try {
          MySqlConnManager._openConnections.push(connection);
          MySqlConnManager._poolConnOpenListeners.forEach((listener) => listener(connection));
        } catch (error) {
          AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', 'Error in adding connection', error);
        }
        AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Connection ${connection.threadId} acquired`);
      });
      conn.on('connection', function (connection) {
        connection.execute(`set session wait_timeout=${env.MYSQL_WAIT_TIMEOUT}`);
        const timeout = connection.execute('SELECT @@wait_timeout');
        AppLogger.trace(
          'mysql-conn-manager.ts',
          'testMySqlPoolConnection',
          'Connection wait timeout set to',
          AppLogger.stringifyObjectForLog(timeout[0])
        );
      });
      conn.on('release', function (connection) {
        MySqlConnManager._poolConnCloseListeners.forEach((listener) => listener(connection));
        try {
          const val = MySqlConnManager._openConnections.find((c: any) => c.threadId === connection.threadId);
          if (val) {
            MySqlConnManager._openConnections = MySqlConnManager._openConnections.filter((c: any) => c.threadId !== connection.threadId);
          }
        } catch (error) {
          AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', 'Error in removing connection', error);
        }
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
    let ssl = this.getSslParams();

    // connect to test DB is APP_ENV variable is set to testing.
    if (env.APP_ENV === ApplicationEnv.TEST) {
      host = config.host || env.MYSQL_HOST_TEST;
      port = config.port || env.MYSQL_PORT_TEST;
      database = config.database || env.MYSQL_DB_TEST;
      user = config.user || env.MYSQL_USER_TEST;
      password = config.password || env.MYSQL_PASSWORD_TEST;
      ssl = undefined;
    }
    return { user, port, host, database, password, config, ssl };
  }

  private getMySqlConnectionSync(config?: mysqlSync.PoolOptions): mysqlSync.Pool {
    const { user, port, host, database, password, ssl } = this.setDbCredentials(config);

    const poolConfig = {
      host,
      port,
      user,
      password,
      database,
      debug: env.MYSQL_DEBUG,
      timezone: env.MYSQL_TIMEZONE,
      connectionLimit: config?.connectionLimit || env.MYSQL_POOL_SIZE,
      ssl
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
