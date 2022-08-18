/**
 * DbLogger logger extends the StandardLogger with the ability to log to the db.
 */
export declare class DbLogger {
    private static sqlInst;
    private static loggerOK;
    private static logToConsole;
    private static DB_TABLE_NAME;
    private static RETENTION;
    private constructor();
    get isLoggerOK(): boolean;
    static init(logToConsole?: boolean): Promise<void>;
    static clearLogs(): Promise<any>;
    static info(fileName: string, methodName: string, ...args: any[]): void;
    static warn(fileName: string, methodName: string, ...args: any[]): void;
    static debug(fileName: string, methodName: string, ...args: any[]): void;
    static trace(fileName: string, methodName: string, ...args: any[]): void;
    static error(fileName: string, methodName: string, ...args: any[]): void;
    static test(fileName: string, methodName: string, ...args: any[]): void;
    static db(fileName: string, methodName: string, ...args: any[]): void;
    static writeDbLog(fileName: string, methodName: string, severity: any, data?: string): Promise<void>;
}
//# sourceMappingURL=db-logger.d.ts.map