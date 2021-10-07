import { ICommonEnv } from 'kalmia-common-lib';
/**
 * Environment object interface.
 */
export interface IMySqlEnv {
    MYSQL_CONN_STRATEGY: string;
    MYSQL_HOST: string;
    MYSQL_PORT: number;
    MYSQL_DB: string;
    MYSQL_USER: string;
    MYSQL_PASSWORD: string;
    MYSQL_POOL_SIZE: number;
    MYSQL_HOST_TEST: string;
    MYSQL_PORT_TEST: number;
    MYSQL_DB_TEST: string;
    MYSQL_USER_TEST: string;
    MYSQL_PASSWORD_TEST: string;
    MYSQL_POOL_SIZE_TEST: number;
}
export declare const env: IMySqlEnv & ICommonEnv;
//# sourceMappingURL=env.d.ts.map