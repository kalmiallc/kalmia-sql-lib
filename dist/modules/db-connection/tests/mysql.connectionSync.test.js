"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_conn_manager_1 = require("../mysql-conn-manager");
// We need this for some strange mysql lib encoding issue. See: https://stackoverflow.com/questions/46227783/encoding-not-recognized-in-jest-js
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('iconv-lite').encodingExists('foo');
describe('MySQL sync', () => {
    let pool;
    it('Query should find none', () => {
        pool = mysql_conn_manager_1.MySqlConnManager.getInstance().reinitializeConnectionSync();
        pool.query('SELECT 1 as count;', (err2, results2) => {
            expect(err2).toBeNull();
            expect(results2[0].count).toBe(1);
            mysql_conn_manager_1.MySqlConnManager.getInstance().endSync();
        });
    });
});
//# sourceMappingURL=mysql.connectionSync.test.js.map