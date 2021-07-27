import type * as mysql from 'mysql2/promise';
import { MySqlConnManager } from '../../db-connection/mysql-conn-manager';
import { MySqlUtil } from './../../db-connection/mysql-util';

describe('Base model', () => {
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

  it.todo('Prop population');
  it.todo('Create');
  it.todo('Read');
  it.todo('Update');
  it.todo('Delete');
  it.todo('Persistence');
});

async function setupDatabase() {
  const conn = await MySqlConnManager.getInstance().getConnection();
  const mysql = new MySqlUtil(conn);
  await mysql.paramExecute(
    `
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`status\` INT NOT NULL,
      \`__username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`));
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
