import { Connection, Pool } from 'mysql2/promise';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { MySqlUtil } from '../db-connection/mysql-util';
/**
 * Testing MySQL stage class.
 */
export declare class MySqlStage {
    private static instance;
    connManager: MySqlConnManager;
    dbConn: Pool | Connection;
    utils: MySqlUtil;
    constructor();
    static getInstance(): Promise<MySqlStage>;
    /**
     * MySQL testing environment init function.
     */
    init(): Promise<void>;
    /**
     * Closes MySQL connection.
     */
    close(): Promise<void>;
}
//# sourceMappingURL=mysql-stage.d.ts.map