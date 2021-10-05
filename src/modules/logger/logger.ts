/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { bgBlack, bgCyan, bgRed, bgWhite, bgYellow, black, cyan, gray, red, white, yellow } from 'colors/safe';
import { env } from '../../config/env';
import { LogType } from '../../config/types';

function currentDateTime() {
  const currDate: Date = new Date();
  return currDate.toLocaleString('sl-SI') + '.' + currDate.getMilliseconds();
}

function expressInConsole(type: LogType, message: string, error?: Error) {
  message = `${typeof message == 'string' ? message : JSON.stringify(message, null, 2)}${message && error && error.message ? ', ' : ''}${
    error ? `${error.message}` || '' : ''
  }`;

  if (type === LogType.ERROR) {
    console.error(`[${type}][${currentDateTime()}]: ${message}`);
  } else if (type === LogType.WARN) {
    console.warn(`[${type}][${currentDateTime()}]: ${message}`);
  } else {
    console.log(`[${type}][${currentDateTime()}]: ${message}`);
  }
}

function expressInColor(type: LogType, message: string, error?: Error) {
  let bgColor = bgBlack;
  let color = black;
  switch (type) {
    case LogType.VERBOSE:
      bgColor = bgWhite;
      color = black;
      break;
    case LogType.INFO:
      bgColor = bgCyan;
      color = cyan;
      break;
    case LogType.WARN:
      bgColor = bgYellow;
      color = yellow;
      break;
    case LogType.ERROR:
      bgColor = bgRed;
      color = red;
      break;
    default:
      bgColor = bgBlack;
      color = white;
  }
  console.log(
    bgColor(black(`[${type}]`)),
    gray(`[${currentDateTime()}]:`),
    color(
      `${typeof message == 'string' ? message : JSON.stringify(message, null, 2)}${message && error && error.message ? ', ' : ''}${
        error ? `${error.message}` || '' : ''
      }`
    )
  );
}

function writeLog(type: LogType, message: string, error?: Error, loglevel?: string): void {
  
  if (!loglevel) {
    loglevel = env.LOG_OUT_LEVEL;
  }

  // filter out log level 
  if (loglevel === LogType.ERROR) {
    if (type === LogType.DEBUG || type === LogType.VERBOSE || type === LogType.WARN || type === LogType.INFO) {
      return;
    }
  }
  if (loglevel === LogType.INFO || loglevel === LogType.ERROR) {
    if (type === LogType.DEBUG || type === LogType.VERBOSE || type === LogType.WARN) {
      return;
    }
  }
  if (loglevel === LogType.WARN || loglevel === LogType.INFO || loglevel === LogType.ERROR) {
    if (type === LogType.DEBUG || type === LogType.VERBOSE) {
      return;
    }
  }
  if (loglevel === LogType.DEBUG ) {
    if (type === LogType.VERBOSE) {
      return;
    }
  }
  
  if (env.LOG_TARGET == 'color') {
    expressInColor(type, message, error);
  } else if (env.LOG_TARGET == 'console') {
    expressInConsole(type, message, error);
  }
}

// console logger is the default logger
export class StandardLogger {
 
  private loglevel: string;
  public setLogLevel(ll: string) {
    this.loglevel = ll;
  }
 
  public info(args: any[]) {
    const fileName = args.shift();
    const methodName = args.shift();
    const location = `[${fileName}/${methodName}]`;
    args.push(location);
    writeLog(LogType.INFO, args.join(', '), null, this.loglevel);
  }
  public debug(args: any[]) {
    const fileName = args.shift();
    const methodName = args.shift();
    const location = `[${fileName}/${methodName}]`;
    args.push(location);
    writeLog(LogType.DEBUG, args.join(', '), null, this.loglevel);
  }

  public verbose(args: any[]) {
    const fileName = args.shift();
    const methodName = args.shift();
    const location = `[${fileName}/${methodName}]`;
    args.push(location);
    writeLog(LogType.VERBOSE, args.join(', '), null, this.loglevel);
  }

  public warn(args: any[]) {
    const fileName = args.shift();
    const methodName = args.shift();
    const location = `[${fileName}/${methodName}]`;
    args.push(location);
    writeLog(LogType.WARN, args.join(', '), null, this.loglevel);
  }
  public error(args: any[]) {
    const fileName = args.shift();
    const methodName = args.shift();
    const location = `[${fileName}/${methodName}]`;
    args.push(location);
    writeLog(LogType.ERROR, args.join(', '), null, this.loglevel);
  }

  // Intended for the messages form the tests
  public test(args: any[]) {
    const fileName = args.shift();
    const methodName = args.shift();
    args.unshift('[ TEST ] ');
    const location = `[${fileName}/${methodName}]`;
    args.push(location);
    writeLog(LogType.INFO, args.join(), null, this.loglevel);
  }
}
