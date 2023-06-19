/* eslint-disable @typescript-eslint/no-floating-promises */
import { AppLogger } from 'kalmia-common-lib';
import { env } from '../../config/env';
import { WorkerLogStatus } from '../../config/types';
import { MySqlUtil } from '../db-connection/mysql-util';

/**
 * DbLogger logger logs to DB. The proper table must be created in the DB. Check the migration script.
 * Logger uses sync function and will not guarantee actual writes to DB. Fails are logeed to console.
 * The table name is defined in the env.DB_LOGGER_TABLE.
 * The table must have the following columns:
 * - id - INT NOT NULL AUTO_INCREMENT
 * - ts - DATETIME DEFAULT CURRENT_TIMESTAMP
 * - file - VARCHAR(1000) NULL
 * - method - VARCHAR(1000) NULL
 * - severity - VARCHAR(255) NULL
 * - data - TEXT NULL
 *
 * Logger will also log to console. Console logging can be disabled if env.CONSOLE_LOGGER is set to false.
 *
 * Logger also supports worker logs. Worker logs are logged to separate table.
 * Logger also supports request logs. Request logs are logged to separate table.
 *
 * Check migration script for worker logs and request logs DB tables.
 *
 */
export interface RequestLogData {
  host: string;
  ip: string;
  statusCode: number;
  method: string;
  url: string;
  endpoint: string;
  userAgent: string;
  origin: string;
  xForwardedFor: string;
  body: string;
  responseTime: number;
  data?: any;
}

export class DbLogger {
  private static sqlInst;
  private static loggerOK = false;
  private static workerLoggerOK = false;
  private static requestLoggerOK = false;

  private constructor() {}

  /**
   * Ends the connection to DB.
   */
  public static async end() {
    await DbLogger.sqlInst.end();
  }

  public static async init() {
    try {
      if (!DbLogger.sqlInst) {
        DbLogger.sqlInst = await MySqlUtil.init(true);
        AppLogger.info('DbLogger', 'DbLogger.ts', 'Logger connection initialized');
      }
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error initializing db logger: ' + error);
    }
  }

  public static async checkInstance() {
    await DbLogger.checkIfDbLoggerInitialized();
    await DbLogger.checkIfWorkerLoggerInitialized();
    await DbLogger.checkIfRequestLoggerInitialized();
  }

  public static async checkIfDbLoggerInitialized(): Promise<void> {
    if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
      await DbLogger.init();
    }
    if (DbLogger.sqlInst.getConnectionPool().pool._closed) {
      await DbLogger.init();
    }
    if (!DbLogger.loggerOK) {
      await DbLogger.checkIfLogDbExists(env.DB_LOGGER_TABLE);
    }
  }

  public static async checkIfWorkerLoggerInitialized(): Promise<void> {
    if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
      await DbLogger.init();
    }
    if (!DbLogger.workerLoggerOK) {
      await DbLogger.checkIfLogDbExists(env.DB_LOGGER_WORKER_TABLE);
    }
  }

  public static async checkIfRequestLoggerInitialized(): Promise<void> {
    if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
      await DbLogger.init();
    }
    if (!DbLogger.requestLoggerOK) {
      await DbLogger.checkIfLogDbExists(env.DB_LOGGER_REQUEST_TABLE);
    }
  }

  public static async checkIfLogDbExists(table): Promise<void> {
    if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
      await DbLogger.checkInstance();
    }
    if (!DbLogger.sqlInst.getConnectionPool()) {
      AppLogger.warn('DbLogger', 'DbLogger.ts', 'Error for logger existence check , no connection pool');
      return;
    }
    const tableData = await DbLogger.sqlInst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${table}'
                              LIMIT 1;`);
    const isTable = tableData[0] as any;
    if (isTable.length > 0 && isTable[0].TABLE_NAME === table) {
      switch (table) {
        case env.DB_LOGGER_TABLE:
          DbLogger.loggerOK = true;
          break;
        case env.DB_LOGGER_WORKER_TABLE:
          DbLogger.workerLoggerOK = true;
          break;
        case env.DB_LOGGER_REQUEST_TABLE:
          DbLogger.requestLoggerOK = true;
          break;
        default:
          break;
      }
      AppLogger.info('DbLogger', 'DbLogger.ts', 'DB logger initialized for table: ' + table);
    } else {
      AppLogger.warn('DbLogger', 'DbLogger.ts', 'Error initializing db logger, logger table not exists:' + table);
    }
  }

  public static async clearStandardLogs(): Promise<any> {
    try {
      await DbLogger.checkInstance();
      AppLogger.info('DbLogger', 'DbLogger.ts', `clearStandardLogs - running for retention: ${env.DB_LOGGER_RETENTION}`);
      await DbLogger.sqlInst.paramExecute(`DELETE FROM \`${env.DB_LOGGER_TABLE}\` WHERE DATEDIFF(NOW(), ts) >= ${env.DB_LOGGER_RETENTION};`);
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearStandardLogs the logger: ', env.DB_LOGGER_TABLE);
    }
  }

  public static async clearWorkerLogs(): Promise<any> {
    try {
      await DbLogger.checkInstance();
      AppLogger.info('DbLogger', 'DbLogger.ts', `clearWorkerLogs - running for retention: ${env.DB_LOGGER_WORKER_RETENTION}`);
      await DbLogger.sqlInst.paramExecute(
        `DELETE FROM \`${env.DB_LOGGER_WORKER_TABLE}\` WHERE DATEDIFF(NOW(), ts) >= ${env.DB_LOGGER_WORKER_RETENTION};`
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearWorkerLogs the logger: ', env.DB_LOGGER_WORKER_TABLE);
    }
  }

  public static async clearRequestLogs(): Promise<any> {
    try {
      await DbLogger.checkInstance();
      AppLogger.info('DbLogger', 'DbLogger.ts', `clearRequestLogs - running for retention: ${env.DB_LOGGER_REQUEST_RETENTION}`);
      await DbLogger.sqlInst.paramExecute(
        `DELETE FROM \`${env.DB_LOGGER_REQUEST_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) >= ${env.DB_LOGGER_REQUEST_RETENTION};`
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearing the clearRequestLogs logger: ', env.DB_LOGGER_REQUEST_TABLE);
    }
  }

  public static info(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.info(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'info', args.join(' ')).catch();
    });
  }

  public static warn(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.warn(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'warn', args.join(' ')).catch();
    });
  }

  public static debug(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.debug(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'debug', args.join(' ')).catch();
    });
  }

  public static trace(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.trace(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'trace', args.join(' ')).catch();
    });
  }

  public static error(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.error(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'error', args.join(' ')).catch();
    });
  }

  public static test(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.test(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'test', args.join(' ')).catch();
    });
  }

  public static db(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.db(fileName, methodName, args);
    }
    DbLogger.checkInstance().then(() => {
      void DbLogger.writeDbLog(fileName, methodName, 'db', args.join(' ')).catch();
    });
  }

  /**
   * Async version for writing to db log.
   */

  public static async writeDbLog(fileName = '', methodName = '', severity, data = '') {
    try {
      await DbLogger.checkIfDbLoggerInitialized();
      if (!DbLogger.loggerOK) {
        return;
      }
      await DbLogger.sqlInst.paramExecute(
        `
      INSERT INTO ${env.DB_LOGGER_TABLE} (file, method, severity, data)
      VALUES (@fileName, @methodName, @severity, @data)
    `,
        { fileName, methodName, severity, data }
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', error);
    }
  }

  /**
   * Write log to database
   *
   * @param status worker status
   * @param message message
   * @param worker worker name
   * @param data any data in JSON
   * @param err Error object
   */
  public static logWorker(status: WorkerLogStatus, worker: string, message: string, data?: any, err?: Error, uuid?: string) {
    DbLogger.checkIfWorkerLoggerInitialized().then(() => {
      DbLogger.logWorkerAsync(status, worker, message, data, err, uuid).catch();
    });
  }

  /**
   * Write request to database log. Function is sync, and will not fail in case of an error. There is no control on the actual write.
   *
   * @param data RequestLogData
   */

  public static logRequest(data: RequestLogData) {
    DbLogger.checkIfRequestLoggerInitialized().then(() => {
      DbLogger.logRequestAsync(data).catch();
    });
  }

  /**
   * Async version of logRRequest
   */

  public static async logRequestAsync(inputData: RequestLogData) {
    try {
      if (env.DB_LOGGER_REQUEST_LOG_TO_CONSOLE === 1) {
        AppLogger.info('Request Log', inputData.method, AppLogger.stringifyObjectForLog(inputData));
      }

      await DbLogger.checkIfRequestLoggerInitialized();
      if (!DbLogger.requestLoggerOK) {
        return;
      }
      if (inputData.data) {
        if (typeof inputData.data !== 'object') {
          inputData.data = { data: inputData.data };
        }
      } else {
        inputData.data = {};
      }

      await DbLogger.sqlInst.paramExecute(
        `
      INSERT INTO ${env.DB_LOGGER_REQUEST_TABLE} (host, ip, statusCode, method, url, endpoint, userAgent, origin, xForwardedFor, body, responseTime, data)
      VALUES (@host, @ip, @statusCode, @method, @url, @endpoint, @userAgent, @origin, @xForwardedFor, @body, @responseTime, @data)
    `,
        {
          host: inputData.host || '',
          ip: inputData.ip || '',
          statusCode: inputData.statusCode || 0,
          method: inputData.method || '',
          url: inputData.url || '',
          endpoint: inputData.endpoint || '',
          userAgent: inputData.userAgent || '',
          origin: inputData.origin || '',
          xForwardedFor: inputData.xForwardedFor || '',
          body: inputData.body || '',
          responseTime: inputData.responseTime || 0,
          data: inputData.data
        }
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to request DB log: ', error);
    }
  }

  /**
   * Async version of logWorker
   */

  public static async logWorkerAsync(status: WorkerLogStatus, worker: string, message: string, data?: any, err?: Error, uuid?: string) {
    try {
      if (env.DB_LOGGER_WORKER_TO_CONSOLE === 1) {
        AppLogger.info('Worker Log', worker, status, message, data, err);
      }
      await DbLogger.checkIfWorkerLoggerInitialized();
      if (!DbLogger.workerLoggerOK) {
        return;
      }
      let error = {};
      if (err) {
        status = WorkerLogStatus.ERROR;
        error = { message: err.message, stack: err.stack };
      }

      if (typeof data !== 'object') {
        data = { data };
      }

      await DbLogger.sqlInst.paramExecute(
        `
	      INSERT INTO ${env.DB_LOGGER_WORKER_TABLE} (status, worker, message, data, error, uuid)
	      VALUES (@status, @worker, @message, @data, @error, @uuid)
	    `,
        { status, worker, message, data, error, uuid: uuid || '' }
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing worker log to DB: ', error);
    }
  }
}
