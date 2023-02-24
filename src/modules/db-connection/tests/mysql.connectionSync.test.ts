/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable-next-line @typescript-eslint/quotes */
import * as mysqlSync from 'mysql2';
import { MySqlConnManager } from '../mysql-conn-manager';

// We need this for some strange mysql lib encoding issue. See: https://stackoverflow.com/questions/46227783/encoding-not-recognized-in-jest-js
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('iconv-lite').encodingExists('foo');

describe('MySQL sync', () => {
  let pool: mysqlSync.Pool;

  it('Query should find none', () => {
    pool = MySqlConnManager.getInstance().reinitializeConnectionSync();
    pool.query('SELECT 1 as count;', (err2, results2) => {
      expect(err2).toBeNull();
      expect(results2[0].count).toBe(1);
      MySqlConnManager.getInstance().endSync();
    });
  });
});
