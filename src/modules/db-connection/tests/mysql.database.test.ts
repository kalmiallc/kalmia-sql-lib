import type * as mysql from 'mysql2/promise';
import { MySqlConnManager } from '../../db-connection/mysql-conn-manager';
import { MySqlUtil } from './../../db-connection/mysql-util';

describe('MySQL', () => {
  let conn: mysql.Pool | mysql.Connection
  let sqlUtil: MySqlUtil;

  beforeAll(async () => {
    conn = await MySqlConnManager.getInstance().getConnection();
    sqlUtil =  new MySqlUtil(conn);
    await setupDatabase();
  });

  afterAll(async () => {
    await dropDatabase();
    await MySqlConnManager.getInstance().end();
  });

  it('Query should find one', async () => {
    await sqlUtil.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`,
      {
        email: `${Math.floor(Math.random() * 10_000)}@example.com`,
        id: Math.floor(Math.random() * 1_000_000)
      },
    );

    const count = await sqlUtil.paramQuery(
      `SELECT COUNT(*) AS 'COUNT' FROM \`sql_lib_user\`;`,
    );
    expect(count.length).toBe(1);
    expect(count).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          COUNT: 1,
        }),
      ]),
    );
  });

  it('Query should fail', async () => {
    await insertObject();
    await cleanDatabase();

    try {
      await sqlUtil.paramQuery(`SELECT COUNT(*) AS 'COUNT' FROM \`sql_lib_user\`;`);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('Query should use two connections', async () => {
    const secondConn = await MySqlConnManager.getInstance().getConnection('secondary');
    const secondUtil = new MySqlUtil(secondConn)
    await sqlUtil.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`,
      {
        email: `${Math.floor(Math.random() * 10_000)}@example.com`,
        id: Math.floor(Math.random() * 1_000_000)
      },
    );

    const count = await secondUtil.paramQuery(
      `SELECT COUNT(*) AS 'COUNT' FROM \`sql_lib_user\`;`,
    );
    await MySqlConnManager.getInstance().end('secondary')
    expect(count.length).toBe(1);
    expect(count).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          COUNT: 1,
        }),
      ]),
    );
  });

  async function insertObject() {
    await sqlUtil.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`,
      {
        email: `${Math.floor(Math.random() * 10_000)}@example.com`,
        id: Math.floor(Math.random() * 1_000_000)
      },
    );
  }
});

async function setupDatabase() {
  const conn = await MySqlConnManager.getInstance().getConnection();
  const mysql = new MySqlUtil(conn);
  await mysql.paramExecute(
    `
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `,
    { },
  );
}

async function dropDatabase() {
  const conn = await MySqlConnManager.getInstance().getConnection();
  const mysql = new MySqlUtil(conn);
  await mysql.paramExecute(
    `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `,
    { },
  );
}

async function cleanDatabase() {
  await dropDatabase();
  await setupDatabase();
}
