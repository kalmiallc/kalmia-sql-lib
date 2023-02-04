/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable-next-line @typescript-eslint/quotes */
import { AppLogger } from 'kalmia-common-lib';
import type * as mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';
import { cleanDatabase, dropDatabase, setupDatabase } from '../../test-helpers/mysql-stage';
import { MySqlConnManager } from '../mysql-conn-manager';
import { MySqlUtil } from '../mysql-util';

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
  let connId = 0;

  beforeAll(async () => {
    conn = await MySqlConnManager.getInstance().getConnectionNoPool();
    expect(MySqlConnManager.getInstance().getActiveConnections().length).toBe(1);
    connId = MySqlConnManager.getInstance().getActiveConnections()[0].connectionId;
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
    expect(MySqlConnManager.getInstance().getActiveConnections().length).toBe(0);
  });

  it('Query should find one', async () => {
    expect(MySqlConnManager.getInstance().getActiveConnections()[0].connectionId).not.toBeNull();
    expect(MySqlConnManager.getInstance().getActiveConnections()[0].connectionId).toBe(connId);
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

describe('MySql use init function', () => {
  let util: MySqlUtil;

  beforeAll(async () => {
    util = await MySqlUtil.init();
    await util.paramExecute(
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
    await util.paramExecute(
      `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `
    );
    await MySqlUtil.end();
  });

  it('Query should find one', async () => {
    await util.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`,
      { email: Math.floor(Math.random() * 10_000) + '@example.com', id: Math.floor(Math.random() * 1_000_000) }
    );
    const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count.length).toBe(1);
  });
});

describe('MySql use init connection from pool with the transaction, and use pass the active connection', () => {
  let util: MySqlUtil;

  beforeAll(async () => {
    util = await MySqlUtil.init(true);
    await util.paramExecute(
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
    await util.paramExecute(
      `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `
    );
    expect((util.getConnectionPool() as any).pool._freeConnections.length).toBe(0);
    expect((util.getConnectionPool() as any).pool._closed).toBe(false);
    const conn = util.getActiveConnection();
    await conn.release();
    expect((util.getConnectionPool() as any).pool._freeConnections.length).toBe(1);
    await util.end();
    expect((util.getConnectionPool() as any).pool._closed).toBe(true);
  });

  it('Query should be rolled back', async () => {
    const conn = await util.start();
    const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(countStart[0].COUNT).toBe(0);

    await util.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`,
      { email: Math.floor(Math.random() * 10_000) + '@example.com', id: Math.floor(Math.random() * 1_000_000) },
      conn
    );
    await conn.rollback();

    const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count[0].COUNT).toBe(0);
  });

  it('Query should fine one in transaction', async () => {
    const conn = await util.start();
    const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(countStart[0].COUNT).toBe(0);

    await util.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`,
      { email: Math.floor(Math.random() * 10_000) + '@example.com', id: Math.floor(Math.random() * 1_000_000) },
      conn
    );
    await conn.commit();

    const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count[0].COUNT).toBe(1);
  });
});

describe('MySql use init connection from pool with the transaction, and use direct pass', () => {
  let util: MySqlUtil;

  beforeAll(async () => {
    let connId;
    MySqlConnManager.addConnOpenListener((conn) => {
      AppLogger.test('mysql.connection.test', 'MySqlConnManager.addConnOpenListener - connection open', conn.threadId);
      connId = conn.threadId;
    });
    MySqlConnManager.addConnCloseListener((conn) => {
      AppLogger.test('mysql.connection.test', 'MySqlConnManager.addConnCloseListener - connection close', conn.threadId);
      expect(conn.threadId).toBe(connId);
    });
    util = await MySqlUtil.init(true);
    expect(MySqlConnManager.getInstance().getActiveConnections().length).toBe(1);
    await util.paramExecute(
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
    await util.paramExecute(
      `
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `
    );
    expect((util.getConnectionPool() as any).pool._freeConnections.length).toBe(0);
    expect((util.getConnectionPool() as any).pool._closed).toBe(false);
    const conn = util.getActiveConnection();
    expect(MySqlConnManager.getInstance().getActiveConnections()[0].connectionId).toBe((conn as any)?.connection?.connectionId);
    await conn.release();
    expect((util.getConnectionPool() as any).pool._freeConnections.length).toBe(1);
    expect(MySqlConnManager.getInstance().getActiveConnections().length).toBe(0);
    await util.end();
    expect((util.getConnectionPool() as any).pool._closed).toBe(true);
  });

  it('Query should be rolled back', async () => {
    const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    await util.getActiveConnection().beginTransaction();
    expect(countStart[0].COUNT).toBe(0);

    await util.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`,
      { email: Math.floor(Math.random() * 10_000) + '@example.com', id: Math.floor(Math.random() * 1_000_000) }
    );
    await util.getActiveConnection().rollback();

    const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count[0].COUNT).toBe(0);
  });

  it('Query should fine one in transaction', async () => {
    const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    await util.getActiveConnection().beginTransaction();
    expect(countStart[0].COUNT).toBe(0);

    await util.paramExecute(
      `INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`,
      { email: Math.floor(Math.random() * 10_000) + '@example.com', id: Math.floor(Math.random() * 1_000_000) }
    );
    await util.getActiveConnection().commit();

    const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
    expect(count[0].COUNT).toBe(1);
  });
});
