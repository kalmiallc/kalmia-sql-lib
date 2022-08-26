import { ICommonEnv } from 'kalmia-common-lib';
/**
 * Environment object interface.
 */
export interface IMySqlEnv {
    MYSQL_HOST: string;
    MYSQL_PORT: number;
    MYSQL_DB: string;
    MYSQL_USER: string;
    MYSQL_PASSWORD: string;
    MYSQL_POOL_SIZE: number;
    MYSQL_CONNECTION_TIMEOUT: number;
    MYSQL_WAIT_TIMEOUT: number;
    MYSQL_TIMEZONE: string;
    MYSQL_DEBUG: boolean;
    MYSQL_HOST_TEST: string;
    MYSQL_PORT_TEST: number;
    MYSQL_DB_TEST: string;
    MYSQL_USER_TEST: string;
    MYSQL_PASSWORD_TEST: string;
    MYSQL_POOL_SIZE_TEST: number;
    MYSQL_SSL_CA_FILE: string;
    MYSQL_SSL_KEY_FILE: string;
    MYSQL_SSL_CERT_FILE: string;
    MAX_PAGE_SIZE: number;
    DB_LOGGER_TABLE: string;
    DB_LOGGER_REQUEST_TABLE: string;
    DB_LOGGER_WORKER_TABLE: string;
    DB_LOGGER_LOG_TO_CONSOLE: number;
    DB_LOGGER_REQUEST_LOG_TO_CONSOLE: number;
    DB_LOGGER_WORKER_TO_CONSOLE: number;
    DB_LOGGER_REQUEST_RETENTION: number;
    DB_LOGGER_WORKER_RETENTION: number;
    DB_LOGGER_RETENTION: number;
}
export declare const env: IMySqlEnv & ICommonEnv;
//# sourceMappingURL=env.d.ts.map