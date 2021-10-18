import { AppLogger, isPlainObject } from 'kalmia-common-lib';
import * as mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
import * as SqlString from 'sqlstring';

/**
 * MySQL helper. This helper is designed for usage of SQL connection pool.
 */
export class MySqlUtil {
  private _dbConnectionPool: Pool;
  private _currentPooledConnection: PoolConnection;

  constructor(dbConnection?: Pool) {
    this._dbConnectionPool = dbConnection;
    return this;
  }

  /**
   * Set active connection (pool connection)
   */
  public setActiveConnection(ac: PoolConnection) {
    this._currentPooledConnection = ac;
  }

  /**
   * Get active connection (pool connection)
   */
  public getActiveConnection() {
    return this._currentPooledConnection;
  }

  /**
   * Release active connection (pool connection)
   */
  public releaseActiveConnection() {
    this._currentPooledConnection.release();
  }

  /**
   * Call single stored procedure inside transaction, and make commit.
   * In case of error the transaction is rolled back.
   *
   * @param procedure name of procedure
   * @param data procedure parameters
   * @param [options={multiSet: boolean}] additional options
   */
  public async callSingle(procedure: string, data: unknown, options: { multiSet?: boolean } = {}): Promise<any> {
    const conn = await this.start();
    try {
      const result = await this.call(procedure, data, conn, options);
      await this.commit(conn);
      return result;
    } catch (err) {
      await this.rollback(conn);
      throw err;
    }
  }

  /**
   * Call stored procedure on database
   *
   * @param procedure procedure name
   * @param data Object with call parameters
   * @returns array of results from database
   */
  public async call(
    procedure: string,
    data: any,
    connection: PoolConnection = this._currentPooledConnection,
    options: { multiSet?: boolean } = {}
  ): Promise<any> {
    let isSingleTrans = false;
    if (!connection) {
      isSingleTrans = true;
      connection = await this._dbConnectionPool.getConnection();
    }
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }

    const query = `CALL ${procedure}(${Object.keys(data).length ? Array(Object.keys(data).length).fill('?').join(',') : ''});`;

    AppLogger.debug('mysql-util.ts', 'call', 'DB ', query);
    AppLogger.debug('mysql-util.ts', 'call', 'DB ', this.mapValues(data, true).join(';'));

    const result = await connection.query(query, this.mapValues(data));

    if (isSingleTrans) {
      connection.release();
    }

    for (const resultSet of result[0] as mysql.RowDataPacket[][]) {
      if (resultSet.length && resultSet[0].ErrorCode > 0) {
        throw new Error(`${resultSet[0].ErrorCode}: '${resultSet[0].Message}'`);
        // throw new CodeException({
        //   status: 500,
        //   code: resultSet[0].ErrorCode,
        //   errorMessage: resultSet[0].Message,
        //   details: result
        // });
      }
    }
    if (!options.multiSet) {
      return result[0][0];
    } else {
      return result[0];
    }
  }

  /**
   * Call stored procedure on database
   *
   * @param procedure procedure name
   * @param data Object with call parameters
   * @returns array of results from database
   */
  public async callDirect(procedure: string, data: any, options: { multiSet?: boolean } = {}): Promise<any> {
    const query = `CALL ${procedure}(${Object.keys(data).length ? Array(Object.keys(data).length).fill('?').join(',') : ''});`;

    AppLogger.debug('mysql-util.ts', 'call', 'DB ', query);
    AppLogger.debug('mysql-util.ts', 'call', 'DB ', this.mapValues(data, true).join(';'));

    const result = await this._dbConnectionPool.query(query, this.mapValues(data));

    for (const resultSet of result[0] as mysql.RowDataPacket[][]) {
      if (resultSet.length && resultSet[0].ErrorCode > 0) {
        throw new Error(`${resultSet[0].ErrorCode}: '${resultSet[0].Message}'`);
        // throw new CodeException({
        //   status: 500,
        //   code: resultSet[0].ErrorCode,
        //   errorMessage: resultSet[0].Message,
        //   details: result
        // });
      }
    }
    if (!options.multiSet) {
      return result[0][0];
    } else {
      return result[0];
    }
  }

  /**
   * This function takes a new connection form the poll and starts transaction.
   *
   * @returns connection from the pool.
   */

  public async start(): Promise<PoolConnection> {
    // await this.db.query('SET SESSION autocommit = 0; START TRANSACTION;');
    const conn = await (this._dbConnectionPool as mysql.Pool).getConnection();
    if (!conn) {
      throw Error('MySql Db Connection not provided');
    }
    await conn.beginTransaction();
    AppLogger.debug('mysql-util.ts', 'start', 'DB ', 'BEGIN TRANSACTION');
    return conn;
  }

  public async commit(connection: PoolConnection = this._currentPooledConnection): Promise<void> {
    // await this.db.query('COMMIT; SET SESSION autocommit = 1;');
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }
    await connection.commit();
    connection.release();
    AppLogger.debug('mysql-util.ts', 'commit', 'DB ', 'COMMIT TRANSACTION');
  }

  public async rollback(connection: PoolConnection = this._currentPooledConnection): Promise<void> {
    // await this.db.query('ROLLBACK; SET SESSION autocommit = 1;');
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }
    await connection.rollback();
    connection.release();
    AppLogger.debug('mysql-util.ts', 'rollback', 'DB ', 'ROLLBACK TRANSACTION');
  }

  /**
   * Translate properties to array of property values for procedure call
   *
   * @param data Object to translate
   * @param [logOutput=false] For logging purpose we should mask the password values
   * @returns Array of values
   */
  public mapValues(data: any, logOutput = false): string[] {
    const protectedFields = ['password'];
    const values: string[] = [];
    for (const i in data) {
      if (!logOutput || protectedFields.indexOf(i) < 0) {
        values.push(data[i]);
      } else {
        values.push('*****');
      }
    }
    return values;
  }

  /**
   * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
   * and executes prepared statement. If there is no connection added to the parameter (or no current pooled connection present on the object)
   * then a new connection will be taken from the pool and released after.
   *
   *
   * @param query SQL query
   * @param values object with replacement values
   * @param connection PoolConnection reference - needed if query is part of transaction
   */
  public async paramExecute(query: string, values?: unknown, connection: PoolConnection = this._currentPooledConnection): Promise<any[]> {
    const sqlParamValues = [];
    let isSingleTrans = false;

    if (!connection) {
      isSingleTrans = true;
      connection = await this._dbConnectionPool.getConnection();
    }
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }

    if (values) {
      // split query to array to find right order of variables
      const queryArray = SqlString.escapeId(query)
        .split(/\n|\s/)
        .filter((x) => !!x && /@.*\b/.test(x));

      for (const word of queryArray) {
        for (const key of Object.keys(values)) {
          // transform array values to string
          if (Array.isArray(values[key])) {
            values[key] = values[key].join(',') || null;
          }

          // regex
          const re = new RegExp(`@${key}\\b`, 'gi');

          if (word.match(re)) {
            if (isPlainObject(values[key])) {
              SqlString.escapeId(sqlParamValues.push(JSON.stringify(values[key])));
            } else {
              SqlString.escapeId(sqlParamValues.push(values[key]));
            }
          }
        }
      }

      // replace keys with '?' for prepared statement
      for (const key of Object.keys(values)) {
        const re = new RegExp(`@${key}\\b`, 'gi');
        query = query.replace(re, '?');
      }
    }

    AppLogger.debug('mysql-util.ts', 'paramExecute', 'DB ', query);
    AppLogger.debug('mysql-util.ts', 'paramExecute', 'DB ', this.mapValues(sqlParamValues, true).join(';'));

    let result;
    // const time = process.hrtime();
    try {
      result = await connection.execute(query, sqlParamValues);
    } catch (err) {
      AppLogger.error('mysql-util.ts', 'paramExecute', err);
      AppLogger.error('mysql-util.ts', 'paramExecute', query);
      AppLogger.error('mysql-util.ts', 'paramExecute', sqlParamValues);

      throw err;
    } finally {
      if (isSingleTrans) {
        connection.release();
      }
    }
    // const diff = process.hrtime(time);

    return result[0] as any[];
  }

  /**
   * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
   * This function uses automatic connection creation and release functionality of mysql lib.
   *
   * @param query SQL query
   * @param values object with replacement values
   *
   */
  public async paramExecuteDirect(query: string, values?: unknown): Promise<any[]> {
    const sqlParamValues = [];

    if (values) {
      // split query to array to find right order of variables
      const queryArray = SqlString.escapeId(query)
        .split(/\n|\s/)
        .filter((x) => !!x && /@.*\b/.test(x));

      for (const word of queryArray) {
        for (const key of Object.keys(values)) {
          // transform array values to string
          if (Array.isArray(values[key])) {
            values[key] = values[key].join(',') || null;
          }

          // regex
          const re = new RegExp(`@${key}\\b`, 'gi');

          if (word.match(re)) {
            if (isPlainObject(values[key])) {
              SqlString.escapeId(sqlParamValues.push(JSON.stringify(values[key])));
            } else {
              SqlString.escapeId(sqlParamValues.push(values[key]));
            }
          }
        }
      }

      // replace keys with '?' for prepared statement
      for (const key of Object.keys(values)) {
        const re = new RegExp(`@${key}\\b`, 'gi');
        query = query.replace(re, '?');
      }
    }

    AppLogger.debug('mysql-util.ts', 'paramExecute', 'DB ', query);
    AppLogger.debug('mysql-util.ts', 'paramExecute', 'DB ', this.mapValues(sqlParamValues, true).join(';'));

    let result;
    // const time = process.hrtime();
    try {
      result = await this._dbConnectionPool.execute(query, sqlParamValues);
    } catch (err) {
      AppLogger.error('mysql-util.ts', 'paramExecute', err);
      AppLogger.error('mysql-util.ts', 'paramExecute', query);
      AppLogger.error('mysql-util.ts', 'paramExecute', sqlParamValues);

      throw err;
    }
    return result[0] as any[];
  }
}
