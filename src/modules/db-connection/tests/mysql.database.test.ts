/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable-next-line @typescript-eslint/quotes */
import type * as mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';
import { MySqlConnManager } from '../../db-connection/mysql-conn-manager';
import { env } from './../../../config/env';
import { MySqlUtil } from './../../db-connection/mysql-util';

describe('MySQL coon pool', () => {
  let conn: mysql.Pool | mysql.Connection;
  let sqlUtil: MySqlUtil;
  env.MYSQL_POOL_SIZE_TEST = 5;

  beforeAll(async () => {
    conn = (await MySqlConnManager.getInstance().getConnection()) as Pool;
    sqlUtil = new MySqlUtil(conn);
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
      }
    );

    const count = await sqlUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count.length).toBe(1);
    expect(count).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          COUNT: 1
        })
      ])
    );
  });

  it('Query should fail', async () => {
    await insertObject();
    await cleanDatabase();

    try {
      await sqlUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('Should escape param', async () => {
    await insertObject();
    const attack = "' UNION all SELECT @@version, NULL, NULL--'";
    const SQL = `SELECT * FROM sql_lib_user Where email like @attack`;
    const data = await sqlUtil.paramExecute(SQL, { attack });
    expect(data.length).toBe(0);

    const data2 = await sqlUtil.paramExecuteDirect(SQL, { attack });
    expect(data2.length).toBe(0);

    await cleanDatabase();
  });

  it('Query should use two connections', async () => {
    const secondConn = (await MySqlConnManager.getInstance().getConnection('secondary')) as Pool;
    const secondUtil = new MySqlUtil(secondConn);
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
      }
    );

    const count = await secondUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    await MySqlConnManager.getInstance().end('secondary');
    expect(count.length).toBe(1);
    expect(count).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          COUNT: 1
        })
      ])
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
      }
    );
  }
});

describe('MySQL coon pool automatic', () => {
  let conn: mysql.Pool;
  let sqlUtil: MySqlUtil;

  beforeAll(async () => {
    conn = (await MySqlConnManager.getInstance().getConnection()) as Pool;
    sqlUtil = new MySqlUtil(conn);
    await setupDatabase();
  });

  afterAll(async () => {
    await dropDatabase();
    await MySqlConnManager.getInstance().end();
  });

  it('Query should find one', async () => {
    await sqlUtil.paramExecuteDirect(
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
      }
    );

    const count = await sqlUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count.length).toBe(1);
    expect(count).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          COUNT: 1
        })
      ])
    );
  });

  it('Query should fail', async () => {
    await insertObject();
    await cleanDatabase();

    try {
      await sqlUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('Query should use two connections', async () => {
    const secondConn = (await MySqlConnManager.getInstance().getConnection('secondary')) as Pool;
    const secondUtil = new MySqlUtil(secondConn);
    await sqlUtil.paramExecuteDirect(
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
      }
    );

    const count = await secondUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    await MySqlConnManager.getInstance().end('secondary');
    expect(count.length).toBe(1);
    expect(count).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          COUNT: 1
        })
      ])
    );
  });

  async function insertObject() {
    await sqlUtil.paramExecuteDirect(
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
      }
    );
  }
});

describe('MySQL no pool', () => {
  let conn: mysql.Connection;

  beforeAll(async () => {
    conn = await MySqlConnManager.getInstance().getConnectionNoPool();
    await conn.execute(
      `
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `
    );
  });

  afterAll(async () => {
    await conn.execute(
      `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `
    );
    await MySqlConnManager.getInstance().end();
  });

  it('Query should find one', async () => {
    await conn.execute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        "${Math.floor(Math.random() * 10_000)}@example.com",
        "${Math.floor(Math.random() * 1_000_000)}"
      )`
    );

    const count = await conn.execute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count.length).toBe(2);
  });
});

async function setupDatabase() {
  const conn = (await MySqlConnManager.getInstance().getConnection()) as Pool;
  const mysqlLoc = new MySqlUtil(conn);
  await mysqlLoc.paramExecute(
    `
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `,
    {}
  );
}

async function dropDatabase() {
  const conn = (await MySqlConnManager.getInstance().getConnection()) as Pool;
  const mysqlLoc = new MySqlUtil(conn);
  await mysqlLoc.paramExecute(
    `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `,
    {}
  );
}

async function cleanDatabase() {
  await dropDatabase();
  await setupDatabase();
}
