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
export declare class DbLogger {
    private static sqlInst;
    private static loggerOK;
    private static workerLoggerOK;
    private static requestLoggerOK;
    private constructor();
    static end(): Promise<void>;
    static init(): Promise<void>;
    static checkIfDbLoggerInitialized(): Promise<void>;
    static checkIfWorkerLoggerInitialized(): Promise<void>;
    static checkIfRequestLoggerInitialized(): Promise<void>;
    static checkIfLogDbExists(table: any): Promise<void>;
    static clearStandardLogs(): Promise<any>;
    static clearWorkerLogs(): Promise<any>;
    static clearRequestLogs(): Promise<any>;
    static info(fileName: string, methodName: string, ...args: any[]): void;
    static warn(fileName: string, methodName: string, ...args: any[]): void;
    static debug(fileName: string, methodName: string, ...args: any[]): void;
    static trace(fileName: string, methodName: string, ...args: any[]): void;
    static error(fileName: string, methodName: string, ...args: any[]): void;
    static test(fileName: string, methodName: string, ...args: any[]): void;
    static db(fileName: string, methodName: string, ...args: any[]): void;
    static writeDbLog(fileName: string, methodName: string, severity: any, data?: string): Promise<void>;
    static writeWorkerLog(fileName: string, methodName: string, severity: any, data?: string): Promise<void>;
    static writeRequestLog(data: RequestLogData): Promise<void>;
}
//# sourceMappingURL=db-logger.d.ts.map