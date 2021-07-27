import * as mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
import * as SqlString from 'sqlstring';
import { isPlainObject } from '../common/utils';
import { AppLogger } from '../logger/app-logger';

/**
 * MySQL class.
 */
export class MySqlUtil {
  private _dbConnection: mysql.Connection | mysql.Pool;

  constructor(dbConnection: mysql.Connection | Pool) {
    this._dbConnection = dbConnection;
    return this;
  }

  /**
   * Call single stored procedure inside transaction
   *
   * @param procedure name of procedure
   * @param data procedure parameters
   * @param [options={multiSet: boolean}] additional options
   */
  public async callSingle(procedure: string, data: unknown, options: { multiSet?: boolean } = {}): Promise<any> {
    // console.time('Call Single');
    const conn = await this.start();
    try {
      const result = await this.call(procedure, data, conn, options);
      await this.commit(conn);
      // console.timeEnd( 'Call Single');
      return result;
    } catch (err) {
      await this.rollback(conn);
      // console.timeEnd( 'Call Single');
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
  public async call(procedure: string, data: any, connection?: PoolConnection, options: { multiSet?: boolean } = {}): Promise<any> {
    let isSingleTrans = false;
    if (!connection) {
      isSingleTrans = true;
      connection = this._dbConnection as PoolConnection;
    }
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }

    const query = `CALL ${procedure}(${Object.keys(data).length ? Array(Object.keys(data).length).fill('?').join(',') : ''});`;

    AppLogger.debug('mysql-util.ts', 'call', 'DB ', query);
    AppLogger.debug('mysql-util.ts', 'call', 'DB ', this.mapValues(data, true).join(';'));

    // console.time('SQL procedure CALL');
    const result = await connection.query(query, this.mapValues(data));
    // console.timeEnd( 'SQL procedure CALL');

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

  public async start(): Promise<PoolConnection> {
    // await this.db.query('SET SESSION autocommit = 0; START TRANSACTION;');
    const conn = await (this._dbConnection as mysql.Pool).getConnection();
    if (!conn) {
      throw Error('MySql Db Connection not provided');
    }
    await conn.beginTransaction();
    AppLogger.debug('mysql-util.ts', 'start', 'DB ', 'BEGIN TRANSACTION');
    return conn;
  }

  public async commit(connection: PoolConnection): Promise<void> {
    // await this.db.query('COMMIT; SET SESSION autocommit = 1;');
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }
    await connection.commit();
    connection.release();
    AppLogger.debug('mysql-util.ts', 'commit', 'DB ', 'COMMIT TRANSACTION');
  }

  public async rollback(connection: PoolConnection): Promise<void> {
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

  public async paramQuery(query: string, values?: unknown): Promise<any[]> {
    // console.time('Param Query');
    const conn = await (this._dbConnection as mysql.Pool).getConnection();
    if (!conn) {
      throw Error('MySql Db Connection not provided');
    }
    if (values) {
      for (const key of Object.keys(values)) {
        if (Array.isArray(values[key])) {
          values[key] = values[key].join(',') || null;
        }
        // SqlString.escape prevents SQL injection!
        const re = new RegExp(`@${key}\\b`, 'gi');
        query = query.replace(re, values[key] ? SqlString.escape(values[key]) : 'NULL');
      }
    }
    // console.log(query);
    AppLogger.debug('mysql-util.ts', 'paramQuery', 'DB ', query);

    const result = await conn.query(query);
    conn.release();
    // console.timeEnd( 'Param Query');
    return result[0] as any[];
  }

  /**
   * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
   * and executes prepared statement
   *
   * @param query SQL query
   * @param values object with replacement values
   * @param connection PoolConnection reference - needed if query is part of transaction
   */
  public async paramExecute(query: string, values?: unknown, connection?: PoolConnection): Promise<any[]> {
    // const queryId = Math.round(Math.random() * 10000);
    // console.time('Param Execute');
    // array with values for prepared statement
    // console.time(`Prepare SQL [${queryId}]`);
    const sqlParamValues = [];
    let isSingleTrans = false;
    if (!connection) {
      isSingleTrans = true;
      connection = await (this._dbConnection as mysql.Pool).getConnection();
    }
    if (!connection) {
      throw Error('MySql Db Connection not provided');
    }

    if (values) {
      // split query to array to find right order of variables
      const queryArray = query.split(/\n|\s/).filter((x) => !!x && /@.*\b/.test(x));

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
              sqlParamValues.push(JSON.stringify(values[key]));
            } else {
              sqlParamValues.push(values[key]);
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
    // console.timeEnd(`Prepare SQL [${queryId}]`);

    AppLogger.debug('mysql-util.ts', 'paramExecute', 'DB ', query);
    AppLogger.debug('mysql-util.ts', 'paramExecute', 'DB ', this.mapValues(sqlParamValues, true).join(';'));
    // console.timeEnd(`Logs [${queryId}]`);

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

    // console.timeEnd( 'Param Execute');
    return result[0] as any[];
  }
}
