/* eslint-disable @typescript-eslint/indent */
import { Model, prop } from '@rawmodel/core';
import { dateParser, integerParser } from '@rawmodel/parsers';
import { Pool, PoolConnection } from 'mysql2/promise';
import { DbModelStatus, PopulateFor, SerializeFor } from '../../config/types';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { MySqlUtil } from '../db-connection/mysql-util';
import { randomUUID } from 'crypto';
import CryptoJS from 'crypto-js';
import { env } from '../../config/env';

/**
 * Update, delete and create actions options.
 */
export interface ActionOptions {
  conn?: PoolConnection;
  context?: {
    user?: any;
  };
}

/**
 * Encryption data definition.
 */
interface EncryptionData {
  value: string;
  nonce: string;
}

/**
 * Common model related objects.
 */
export { prop };

/**
 * Base model.
 */
export abstract class BaseModel extends Model<any> {
  /**
   * Base model's id property definition.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.ALL, SerializeFor.ADMIN]
  })
  public id: number;

  /**
   * Time of creation.
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.ADMIN, SerializeFor.ALL]
  })
  public _createTime: Date;

  /**
   * ID of the user that created the model.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.ADMIN, SerializeFor.INSERT_DB, SerializeFor.ALL]
  })
  public _createUser: number;

  /**
   * Time of the last update.
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.ADMIN, SerializeFor.ALL]
  })
  public _updateTime: Date;

  /**
   * ID of the user that updated the model.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.ADMIN, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.ALL]
  })
  public _updateUser: number;

  /**
   * Base model's status property definition
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.ALL, SerializeFor.ADMIN, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    emptyValue: () => DbModelStatus.ACTIVE,
    defaultValue: () => DbModelStatus.ACTIVE
  })
  public status: number;

  /**
   * Model's table name.
   */
  public abstract tableName: string;

  /**
   * Class constructor.
   *
   * @param data Input data.
   * @param context Application context.
   * @param parent Model's parent model.
   */
  public constructor(data?: unknown, context?: any, parent?: Model) {
    super(data, { context, parent });
  }

  /**
   * Tells if the model represents a document stored in the database.
   */
  public exists(): boolean {
    return !!this.id && this.status !== DbModelStatus.DELETED;
  }

  /**
   * Returns an instance of a database connection.
   */
  public async db(): Promise<Pool> {
    return await MySqlConnManager.getInstance().getConnection();
  }

  /**
   * Returns an instance of a sql utils.
   */
  public async sql(conn?: Pool): Promise<MySqlUtil> {
    return new MySqlUtil(conn || (await this.db()));
  }

  /**
   * Returns DB connection with transaction support.
   *
   * @param conn Existing connection.
   * @returns {
   * singleTrans: Tells if connection will be used in transaction.
   * sql: MySqlUtil
   * conn: PoolConnection
   * }
   */
  public async getDbConnection(conn?: PoolConnection): Promise<{ singleTrans: boolean; sql: MySqlUtil; conn: PoolConnection }> {
    const singleTrans = !conn;
    let sql: MySqlUtil;

    if (singleTrans) {
      sql = await this.sql();
      conn = await sql.start();
    }
    sql = new MySqlUtil();
    sql.setActiveConnection(conn);

    return { singleTrans, sql, conn };
  }

  /**
   * Saves model data in the database as a new row. It will add only the
   * fields that are marked as serializable for insert DB
   *
   * @param options Create options.
   * @returns this
   */
  public async create(options: ActionOptions = {}): Promise<this> {
    if (!options?.context) {
      options.context = this.getContext();
    }

    if (options?.context?.user?.id) {
      this._createUser = options.context.user.id;
      this._updateUser = this._createUser;
    }

    const serializedModel = this.serialize(SerializeFor.INSERT_DB);
    delete serializedModel.id;
    delete serializedModel._createTime;
    delete serializedModel._updateTime;

    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = await this.db();
      mySqlHelper = new MySqlUtil(pool);
    }

    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    mySqlHelper = new MySqlUtil();
    mySqlHelper.setActiveConnection(options.conn);

    try {
      const createQuery = `
      INSERT INTO \`${this.tableName}\`
      ( ${Object.keys(serializedModel)
        .map((x) => `\`${x}\``)
        .join(', ')} )
      VALUES (
        ${Object.keys(serializedModel)
          .map((key) => `@${key}`)
          .join(', ')}
      )`;

      await mySqlHelper.paramExecute(createQuery, serializedModel, options.conn);
      if (!this.id) {
        const req = await mySqlHelper.paramExecute('SELECT last_insert_id() AS id;', null, options.conn);
        this.id = req[0].id;
      }

      this._createTime = new Date();
      this._updateTime = this._createTime;
      if (isSingleTrans) {
        await mySqlHelper.commit(options.conn);
      }
    } catch (err) {
      if (isSingleTrans) {
        await mySqlHelper.rollback(options.conn);
      }
      throw new Error(err);
    }

    return this;
  }

  /**
   * Updates model data in the database.  It will add only the
   * fields that are marked as serializable for update DB
   *
   * @param options Update options.
   * @returns this
   */
  public async update(options: ActionOptions = {}): Promise<this> {
    if (!options?.context) {
      options.context = this.getContext();
    }

    if (options?.context?.user?.id) {
      this._updateUser = options.context.user.id;
    }

    const serializedModel = this.serialize(SerializeFor.UPDATE_DB);

    // Remove non-updatable parameters
    delete serializedModel.id;
    delete serializedModel._createTime;
    delete serializedModel._updateTime;

    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = await this.db();
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    mySqlHelper = new MySqlUtil();
    mySqlHelper.setActiveConnection(options.conn);

    try {
      const updateQuery = `
      UPDATE \`${this.tableName}\`
      SET
        ${Object.keys(serializedModel)
          .map((x) => `\`${x}\` = @${x}`)
          .join(',\n')}
      WHERE id = @id
      `;

      // Reset id parameter for where clause.
      serializedModel.id = this.id;
      await mySqlHelper.paramExecute(updateQuery, serializedModel, options.conn);

      this._updateTime = new Date();
      if (isSingleTrans) {
        await mySqlHelper.commit(options.conn);
      }
    } catch (err) {
      if (isSingleTrans) {
        await mySqlHelper.rollback(options.conn);
      }
      throw new Error(err);
    }

    return this;
  }

  /**
   * Populates model fields by id.  It will only populate the
   * fields that are marked as serializable for populate DB.
   *
   * @param id Model's database ID.
   */
  public async populateById(id: any): Promise<this> {
    if (!id) {
      return this.reset();
    }

    const data = await new MySqlUtil(await this.db()).paramExecute(
      `
      SELECT * FROM ${this.tableName}
      WHERE id = @id
    `,
      { id }
    );

    if (data && data.length) {
      return this.populate(data[0], PopulateFor.DB);
    } else {
      return this.reset();
    }
  }

  /**
   * Marks model as deleted in the database - soft delete.
   *
   * @param options Delete options.
   * @returns this
   */
  public async delete(options: ActionOptions = {}): Promise<this> {
    if (!options?.context) {
      options.context = this.getContext();
    }

    if (options?.context?.user?.id) {
      this._updateUser = options.context.user.id;
    }

    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = await this.db();
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    mySqlHelper = new MySqlUtil();
    mySqlHelper.setActiveConnection(options.conn);

    try {
      const deleteQuery = `
        UPDATE \`${this.tableName}\`
        SET status = @status
        WHERE id = @id
      `;

      await mySqlHelper.paramExecute(
        deleteQuery,
        {
          id: this.id,
          status: (this.status = DbModelStatus.DELETED)
        },
        options.conn
      );

      this._updateTime = new Date();
      if (isSingleTrans) {
        await mySqlHelper.commit(options.conn);
      }
    } catch (err) {
      if (isSingleTrans) {
        await mySqlHelper.rollback(options.conn);
      }
      throw new Error(err);
    }

    return this;
  }

  /**
   * Returns base model select fields used in querying.
   *
   * @param table Queried table synonym.
   * @returns Default select columns.
   */
  public getSelectColumns(table: string): string {
    return `
      ${table}.id,
      ${table}.status,
      ${table}._createTime,
      ${table}._createUser,
      ${table}._updateTime,
      ${table}._updateUser
    `;
  }

  /**
   * Returns mapped default selected columns. Column name is mapped with the table prefix.
   *
   * @param table Queried table synonym.
   * @returns Default select mapped columns.
   */
  public getMappedSelectColumns(table: string): string {
    return `
      ${table}.id as ${table}Id,
      ${table}.status as ${table}Status,
      ${table}._createTime as ${table}CreateTime,
      ${table}._createUser as ${table}CreateUser,
      ${table}._updateTime as ${table}UpdateTime,
      ${table}._updateUser as ${table}UpdateUser
    `;
  }

  /**
   * Parses mapped selected columns back to their original fields.
   *
   * @param table Queried table synonym.
   * @param data Data to parse from.
   * @returns Parsed default selected columns.
   */
  public parseMappedSelectColumns(
    table: string,
    data: any
  ): {
    id: number;
    status: DbModelStatus;
    _createTime: Date;
    _createUser: number;
    _updateTime: Date;
    _updateUser: number;
  } {
    return {
      ...{ id: data[`${table}Id`] ? data[`${table}Id`] : null },
      ...{ status: data[`${table}Status`] ? data[`${table}Status`] : null },
      ...{ _createTime: data[`${table}CreateTime`] ? data[`${table}CreateTime`] : null },
      ...{ _createUser: data[`${table}CreateUser`] ? data[`${table}CreateUser`] : null },
      ...{ _updateTime: data[`${table}UpdateTime`] ? data[`${table}UpdateTime`] : null },
      ...{ _updateUser: data[`${table}UpdateUser`] ? data[`${table}UpdateUser`] : null }
    };
  }

    /**
   * Encrypts given value.
   *
   * @param value Value to encrypt.
   * @returns Encrypted value.
   */
  public static encrypt(value: string): string {
    if (!value) {
      return value;
    }

    const data: EncryptionData = {
      value,
      nonce: randomUUID()
    };

    return CryptoJS.AES.encrypt(JSON.stringify(data), env.APP_ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypts given input.
   *
   * @param input Input to decrypt.
   * @returns Decrypted value.
   */
  public static decrypt(input: string): string {
    if (!input) {
      return input;
    }

    const data: EncryptionData = JSON.parse(CryptoJS.AES.decrypt(input, env.APP_ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8));
    return data?.value;
  }
}
