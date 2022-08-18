/* eslint-disable @typescript-eslint/no-floating-promises */
import { AppLogger } from 'kalmia-common-lib';
import { env } from '../../config/env';
import { MySqlUtil } from '../db-connection/mysql-util';

/**
 * DbLogger logger extends the StandardLogger with the ability to log to the db.
 */

export class DbLogger {
  private static sqlInst;
  private static loggerOK = false;
  private static logToConsole = false;

  private static DB_TABLE_NAME = env.DB_LOGGER_TABLE;
  private static RETENTION = env.DB_LOGGER_RETENTION;

  private constructor() {}

  public get isLoggerOK(): boolean {
    return DbLogger.loggerOK;
  }

  public static async init(logToConsole = true) {
    DbLogger.logToConsole = logToConsole;
    try {
      // check if logger table exists
      DbLogger.sqlInst = await MySqlUtil.init();
      DbLogger.loggerOK = true;
      const tableData = await DbLogger.sqlInst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${DbLogger.DB_TABLE_NAME}'
                              LIMIT 1;`);
      const isTable = tableData[0] as any;
      if (isTable.length > 0 && isTable[0].TABLE_NAME === DbLogger.DB_TABLE_NAME) {
        DbLogger.loggerOK = true;
        console.log('DbLogger', 'DbLogger.ts', 'DB logger initialized for table: ' + DbLogger.DB_TABLE_NAME);
      } else {
        console.warn('DbLogger', 'DbLogger.ts', 'Error initializing db logger, logger table not exists:' + DbLogger.DB_TABLE_NAME);
      }
    } catch (error) {
      console.error('DbLogger', 'DbLogger.ts', 'Error initializing db logger: ' + error);
    }
  }

  public static async clearLogs(): Promise<any> {
    try {
      AppLogger.info('DbLogger', 'DbLogger.ts', `ClearLogs - running for retention: ${DbLogger.DB_TABLE_NAME}`);
      DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${DbLogger.DB_TABLE_NAME}\` WHERE DATEDIFF(NOW(), ts) > ${DbLogger.RETENTION};`);
      DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${DbLogger.DB_TABLE_NAME}\` WHERE DATEDIFF(NOW(), _createTime) > ${DbLogger.RETENTION};`);
    } catch (error) {
      AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearing the logger: ', DbLogger.DB_TABLE_NAME);
    }
  }

  public static info(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.info(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'info', args.join(' ')).catch();
  }

  public static warn(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.warn(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'warn', args.join(' ')).catch();
  }

  public static debug(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.debug(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'debug', args.join(' ')).catch();
  }

  public static trace(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.trace(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'trace', args.join(' ')).catch();
  }

  public static error(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.error(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'error', args.join(' ')).catch();
  }

  public static test(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.test(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'test', args.join(' ')).catch();
  }

  public static db(fileName: string, methodName: string, ...args) {
    if (!DbLogger.loggerOK) {
      return;
    }
    if (DbLogger.logToConsole) {
      AppLogger.db(fileName, methodName, args);
    }
    void DbLogger.writeDbLog(fileName, fileName, 'db', args.join(' ')).catch();
  }

  public static async writeDbLog(fileName = '', methodName = '', severity, data = '') {
    try {
      await DbLogger.sqlInst.paramExecuteDirect(
        `
      INSERT INTO ${DbLogger.DB_TABLE_NAME} (file, method, severity, data)
      VALUES (@fileName, @methodName, @severity, @data)
    `,
        { fileName, methodName, severity, data }
      );
    } catch (error) {
      console.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', DbLogger.DB_TABLE_NAME);
    }
  }
}
