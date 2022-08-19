import { WorkerLogStatus } from '../../config/types';
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
export declare class DbLogger {
    private static sqlInst;
    private static loggerOK;
    private static workerLoggerOK;
    private static requestLoggerOK;
    private constructor();
    /**
     * Ends the connection to DB.
     */
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
    /**
     * Async version for writing to db log.
     */
    static writeDbLog(fileName: string, methodName: string, severity: any, data?: string): Promise<void>;
    /**
     * Write log to database
     *
     * @param status worker status
     * @param message message
     * @param worker worker name
     * @param data any data in JSON
     * @param err Error object
     */
    static logWorker(status: WorkerLogStatus, worker: string, message: string, data?: any, err?: Error, uuid?: string): void;
    /**
     * Write request to database log. Function is sync, and will not fail in case of an error. There is no control on the actual write.
     *
     * @param data RequestLogData
     */
    static logRequest(data: RequestLogData): void;
    /**
     * Async version of logRRequest
     */
    static logRequestAsync(inputData: RequestLogData): Promise<void>;
    /**
     * Async version of logWorker
     */
    static logWorkerAsync(status: WorkerLogStatus, worker: string, message: string, data?: any, err?: Error, uuid?: string): Promise<void>;
}
//# sourceMappingURL=db-logger.d.ts.map