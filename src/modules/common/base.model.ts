import { Model, ModelConfig, prop } from '@rawmodel/core';
import { dateParser, integerParser } from '@rawmodel/parsers';
import { Connection, Pool, PoolConnection } from 'mysql2/promise';
import { DbModelStatus, PopulateFor, SerializeFor } from '../../config/types';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { MySqlUtil } from '../db-connection/mysql-util';
import { Context } from './context';

/**
 * Common model related objects.
 */
export { prop };

/**
 * Base model.
 */
export abstract class BaseModel extends Model<Context> {

  /**
   * Base model's id property definition.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public id: number;

  /**
   * Time of creation.
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _createTime: Date;

  /**
   * ID of the user that created the model.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _createUser: number;

  /**
   * Time of the last update.
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _updateTime: Date;

  /**
   * ID of the user that updated the model.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _updateUser: number;

  /**
   * Base model's status property definition
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE, SerializeFor.UPDATE_DB],
    defaultValue: () => DbModelStatus.INACTIVE
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
   * @param config Model configuration.
   */
  public constructor(data?: unknown, config?: ModelConfig<Context>) {
    super(data, config);
  }

  /**
   * Tells if the model represents a document stored in the database.
   */
  public exists(): boolean {
    return !!this.id && (this.status !== DbModelStatus.DELETED);
  }

  /**
   * Returns an instance of a database connection.
   */
  public async db(): Promise<Pool | Connection> {
    return await MySqlConnManager.getInstance().getConnection();
  }


  /**
   * Saves model data in the database as a new row.
   * @param options Create options.
   * @returns this
   */
  public async create(options: { conn?: PoolConnection; context?: Context } = {}): Promise<this> {
    if (options?.context?.user?.id) {
      this._createUser = options.context.user.id;
      this._updateUser = this._createUser;
    }

    const serializedModel = this.serialize(SerializeFor.INSERT_DB);

    // Remove non-creatable parameters
    delete serializedModel.id;
    delete serializedModel._createTime;
    delete serializedModel._updateTime;

    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = (await MySqlConnManager.getInstance().getConnection()) as PoolConnection;
      mySqlHelper = new MySqlUtil(pool);
    }

    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    mySqlHelper = new MySqlUtil(options.conn);
  
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
   * Updates model data in the database.
   * @param options Update options.
   * @returns this
   */
  public async update(options: { conn?: PoolConnection; context?: Context } = {}): Promise<this> {
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
      const pool = (await MySqlConnManager.getInstance().getConnection()) as PoolConnection;
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    mySqlHelper = new MySqlUtil(options.conn);

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
   * Populates model fields by id.
   *
   * @param id Model's database ID.
   */
  public async populateById(id: any): Promise<this> {
    const data = await new MySqlUtil((await MySqlConnManager.getInstance().getConnection()) as Pool).paramQuery(
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
  public async delete(options: { conn?: PoolConnection; context?: Context } = {}): Promise<this> {
    if (options?.context?.user?.id) {
      this._updateUser = options.context.user.id;
    }

    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = (await MySqlConnManager.getInstance().getConnection()) as PoolConnection;
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    mySqlHelper = new MySqlUtil(options.conn);

    try {
      const deleteQuery = `
        UPDATE \`${this.tableName}\`
        SET status = @status
        WHERE id = @id
      `;

      await mySqlHelper.paramExecute(deleteQuery, {
        id: this.id,
        status: (this.status = DbModelStatus.DELETED),
      }, options.conn);
      
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
   * @param table Queried table synonym.
   * @returns Default select columns.
   */
  public getSelectColumns(table: string): string {
    return `
      ${table}.id,
      ${table}.status,
      ${table}._createTime,
      ${table}._updateTime
    `;
  }

  /**
   * Returns DB connection with transaction support.
   * @param conn Existing connection.
   * @returns {
   *  singleTrans: Tells if connection will be used in transaction.
   *  sql: MySqlUtil
   * }
   */
  public async getDbConnection(conn?: PoolConnection): Promise<{ singleTrans: boolean; sql: MySqlUtil }> {
    const singleTrans = !conn;
    let sql: MySqlUtil;

    if (singleTrans) {
      sql = new MySqlUtil(await this.db());
      conn = await sql.start();
    }
    sql = new MySqlUtil(conn);

    return { singleTrans, sql };
  }
}
