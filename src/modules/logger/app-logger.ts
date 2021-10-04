/**
 * AppLogger is general wrapper that is compliant with other logging frameworks, such as Pino, Winston, NestJs logger.
 * This class provides wrapper for logging. Developer should always use methods from this class for the logging.
 * Currently standard logger is used as default.
 *
 * The default logger can be overridden with the setLogger method.
 */

import { inspect } from 'util';
import { StandardLogger } from './logger';

export interface IAppLogger {
  error(args: any[]);
  info(args: any[]);
  warn(args: any[]);
  debug(args: any[]);
  verbose(args: any[]); 

  setLogLevel(ll: string);
}

export class AppLogger {
  private static logger: IAppLogger = new StandardLogger();
  public static setLogger(logger: IAppLogger) {
    AppLogger.logger = logger;
  }

  public static info(fileName: string, methodName: string, ...args) {
    AppLogger.logger.info([fileName, methodName, ...args]);
  }
  public static debug(fileName: string, methodName: string, ...args) {
    AppLogger.logger.debug([fileName, methodName, ...args]);
  }

  public static trace(fileName: string, methodName: string, ...args) {
    AppLogger.logger.verbose([fileName, methodName, ...args]);
  }

  public static warn(fileName: string, methodName: string, ...args) {
    AppLogger.logger.warn([fileName, methodName, ...args]);
  }
  public static error(fileName: string, methodName: string, ...args) {
    AppLogger.logger.error([fileName, methodName, ...args]);
  }

  // Intended for the messages form the tests
  public static test(fileName: string, methodName: string, ...args) {
    args.unshift('[ TEST ] ');
    AppLogger.logger.info([fileName, methodName, ...args]);
  }

  public static stringifyObjectForLog(data: any, depth: number = 3, showHidden: boolean = false) {
    return inspect(data, { showHidden, depth });
  }

  public static overrideLevel(level: string){
    this.logger.setLogLevel(level);
  }
}
