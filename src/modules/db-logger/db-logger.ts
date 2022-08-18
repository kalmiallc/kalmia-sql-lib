/* eslint-disable @typescript-eslint/no-floating-promises */
import { AppLogger } from 'kalmia-common-lib';
import { env } from '../../config/env';
import { MySqlUtil } from '../db-connection/mysql-util';

/**
 * DbLogger logger logs to DB. The proper table must be created in the DB. Check the migration script.
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
 */
export interface RequestLogData {
  host: string;
  ip: string;
  statusCode: string;
  method: string;
  url: string;
  endpoint: string;
  userAgent: string;
  origin: string;
  xForwardedFor: string;
  body: string;
  responseTime: Date;
}

export class DbLogger {
  private static sqlInst;
  private static loggerOK = false;
  private static workerLoggerOK = false;
  private static requestLoggerOK = false;

  private constructor() {}

  public static async end() {
    await DbLogger.sqlInst.end();
  }

  public static async init() {
    try {
      DbLogger.sqlInst = await MySqlUtil.init();
      AppLogger.info('DbLogger', 'DbLogger.ts', 'Logger connection initialized');
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error initializing db logger: ' + error);
    }
  }

  public static async checkIfDbLoggerInitialized(): Promise<void> {
    if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
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
      await DbLogger.checkIfLogDbExists(env.DB_LOGGER_WORKER_TABLE);
    }
  }

  public static async checkIfLogDbExists(table): Promise<void> {
    const tableData = await DbLogger.sqlInst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${table}'
                              LIMIT 1;`);
    const isTable = tableData[0] as any;
    if (isTable.length > 0 && isTable[0].TABLE_NAME === table) {
      DbLogger.loggerOK = true;
      AppLogger.info('DbLogger', 'DbLogger.ts', 'DB logger initialized for table: ' + table);
    } else {
      AppLogger.warn('DbLogger', 'DbLogger.ts', 'Error initializing db logger, logger table not exists:' + table);
    }
  }

  public static async clearStandardLogs(): Promise<any> {
    try {
      AppLogger.info('DbLogger', 'DbLogger.ts', `clearStandardLogs - running for retention: ${env.DB_LOGGER_TABLE}`);
      DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env.DB_LOGGER_TABLE}\` WHERE DATEDIFF(NOW(), ts) > ${env.DB_LOGGER_RETENTION};`);
      DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env.DB_LOGGER_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) > ${env.DB_LOGGER_RETENTION};`);
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearStandardLogs the logger: ', env.DB_LOGGER_TABLE);
    }
  }

  public static async clearWorkerLogs(): Promise<any> {
    try {
      AppLogger.info('DbLogger', 'DbLogger.ts', `clearWorkerLogs - running for retention: ${env.DB_LOGGER_WORKER_TABLE}`);
      DbLogger.sqlInst.paramExecuteDirect(
        `DELETE FROM \`${env.DB_LOGGER_WORKER_TABLE}\` WHERE DATEDIFF(NOW(), ts) > ${env.DB_LOGGER_WORKER_RETENTION};`
      );
      DbLogger.sqlInst.paramExecuteDirect(
        `DELETE FROM \`${env.DB_LOGGER_WORKER_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) > ${env.DB_LOGGER_WORKER_RETENTION};`
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearWorkerLogs the logger: ', env.DB_LOGGER_WORKER_TABLE);
    }
  }

  public static async clearRequestLogs(): Promise<any> {
    try {
      AppLogger.info('DbLogger', 'DbLogger.ts', `clearRequestLogs - running for retention: ${env.DB_LOGGER_REQUEST_TABLE}`);
      DbLogger.sqlInst.paramExecuteDirect(
        `DELETE FROM \`${env.DB_LOGGER_REQUEST_TABLE}\` WHERE DATEDIFF(NOW(), ts) > ${env.DB_LOGGER_REQUEST_RETENTION};`
      );
      DbLogger.sqlInst.paramExecuteDirect(
        `DELETE FROM \`${env.DB_LOGGER_REQUEST_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) > ${env.DB_LOGGER_REQUEST_RETENTION};`
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearing the clearRequestLogs logger: ', env.DB_LOGGER_REQUEST_TABLE);
    }
  }

  public static info(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.info(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'info', args.join(' ')).catch();
  }

  public static warn(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.warn(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'warn', args.join(' ')).catch();
  }

  public static debug(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.debug(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'debug', args.join(' ')).catch();
  }

  public static trace(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.trace(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'trace', args.join(' ')).catch();
  }

  public static error(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.error(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'error', args.join(' ')).catch();
  }

  public static test(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.test(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'test', args.join(' ')).catch();
  }

  public static db(fileName: string, methodName: string, ...args) {
    if (env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
      AppLogger.db(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'db', args.join(' ')).catch();
  }

  public static async writeDbLog(fileName = '', methodName = '', severity, data = '') {
    try {
      await DbLogger.checkIfDbLoggerInitialized();
      if (!DbLogger.loggerOK) {
        return;
      }
      await DbLogger.sqlInst.paramExecuteDirect(
        `
      INSERT INTO ${env.DB_LOGGER_TABLE} (file, method, severity, data)
      VALUES (@fileName, @methodName, @severity, @data)
    `,
        { fileName, methodName, severity, data }
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', env.DB_LOGGER_TABLE);
    }
  }

  public static async writeWorkerLog(fileName = '', methodName = '', severity, data = '') {}

  public static async writeRequestLog(data: RequestLogData) {
    try {
      await DbLogger.checkIfRequestLoggerInitialized();
      if (!DbLogger.requestLoggerOK) {
        return;
      }
      await DbLogger.sqlInst.paramExecuteDirect(
        `
      INSERT INTO ${env.DB_LOGGER_TABLE} (file, method, severity, data)
      VALUES (@host, @ip, @statusCode, @method, @url, @endpoint, @userAgent, @origin, @xForwardedFor, @body, @responseTime)
    `,
        {
          host: data.host,
          ip: data.ip,
          statusCode: data.statusCode,
          method: data.method,
          url: data.url,
          endpoint: data.endpoint,
          userAgent: data.userAgent,
          origin: data.origin,
          xForwardedFor: data.xForwardedFor,
          body: data.body,
          responseTime: data.responseTime
        }
      );
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', env.DB_LOGGER_TABLE);
    }
  }
}
