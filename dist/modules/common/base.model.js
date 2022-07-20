"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = exports.prop = void 0;
/* eslint-disable @typescript-eslint/indent */
const core_1 = require("@rawmodel/core");
Object.defineProperty(exports, "prop", { enumerable: true, get: function () { return core_1.prop; } });
const parsers_1 = require("@rawmodel/parsers");
const types_1 = require("../../config/types");
const mysql_conn_manager_1 = require("../db-connection/mysql-conn-manager");
const mysql_util_1 = require("../db-connection/mysql-util");
/**
 * Base model.
 */
class BaseModel extends core_1.Model {
    /**
     * Class constructor.
     *
     * @param data Input data.
     * @param context Application context.
     * @param parent Model's parent model.
     */
    constructor(data, context, parent) {
        super(data, { context, parent });
    }
    /**
     * Tells if the model represents a document stored in the database.
     */
    exists() {
        return !!this.id && this.status !== types_1.DbModelStatus.DELETED;
    }
    /**
     * Returns an instance of a database connection.
     */
    async db() {
        return await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection();
    }
    /**
     * Returns an instance of a sql utils.
     */
    async sql(conn) {
        return new mysql_util_1.MySqlUtil(conn || (await this.db()));
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
    async getDbConnection(conn) {
        const singleTrans = !conn;
        let sql;
        if (singleTrans) {
            sql = await this.sql();
            conn = await sql.start();
        }
        sql = new mysql_util_1.MySqlUtil();
        sql.setActiveConnection(conn);
        return { singleTrans, sql, conn };
    }
    /**
     * Saves model data in the database as a new row.
     *
     * @param options Create options.
     * @returns this
     */
    async create(options = {}) {
        var _a, _b;
        if (!(options === null || options === void 0 ? void 0 : options.context)) {
            options.context = this.getContext();
        }
        if ((_b = (_a = options === null || options === void 0 ? void 0 : options.context) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) {
            this._createUser = options.context.user.id;
            this._updateUser = this._createUser;
        }
        const serializedModel = this.serialize(types_1.SerializeFor.INSERT_DB);
        delete serializedModel.id;
        delete serializedModel._createTime;
        delete serializedModel._updateTime;
        let isSingleTrans = false;
        let mySqlHelper;
        if (!options.conn) {
            isSingleTrans = true;
            const pool = await this.db();
            mySqlHelper = new mysql_util_1.MySqlUtil(pool);
        }
        if (isSingleTrans) {
            options.conn = await mySqlHelper.start();
        }
        mySqlHelper = new mysql_util_1.MySqlUtil();
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
        }
        catch (err) {
            if (isSingleTrans) {
                await mySqlHelper.rollback(options.conn);
            }
            throw new Error(err);
        }
        return this;
    }
    /**
     * Updates model data in the database.
     *
     * @param options Update options.
     * @returns this
     */
    async update(options = {}) {
        var _a, _b;
        if (!(options === null || options === void 0 ? void 0 : options.context)) {
            options.context = this.getContext();
        }
        if ((_b = (_a = options === null || options === void 0 ? void 0 : options.context) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) {
            this._updateUser = options.context.user.id;
        }
        const serializedModel = this.serialize(types_1.SerializeFor.UPDATE_DB);
        // Remove non-updatable parameters
        delete serializedModel.id;
        delete serializedModel._createTime;
        delete serializedModel._updateTime;
        let isSingleTrans = false;
        let mySqlHelper;
        if (!options.conn) {
            isSingleTrans = true;
            const pool = await this.db();
            mySqlHelper = new mysql_util_1.MySqlUtil(pool);
        }
        if (isSingleTrans) {
            options.conn = await mySqlHelper.start();
        }
        mySqlHelper = new mysql_util_1.MySqlUtil();
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
        }
        catch (err) {
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
    async populateById(id) {
        if (!id) {
            return this.reset();
        }
        const data = await new mysql_util_1.MySqlUtil(await this.db()).paramExecute(`
      SELECT * FROM ${this.tableName}
      WHERE id = @id
    `, { id });
        if (data && data.length) {
            return this.populate(data[0], types_1.PopulateFor.DB);
        }
        else {
            return this.reset();
        }
    }
    /**
     * Marks model as deleted in the database - soft delete.
     *
     * @param options Delete options.
     * @returns this
     */
    async delete(options = {}) {
        var _a, _b;
        if (!(options === null || options === void 0 ? void 0 : options.context)) {
            options.context = this.getContext();
        }
        if ((_b = (_a = options === null || options === void 0 ? void 0 : options.context) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) {
            this._updateUser = options.context.user.id;
        }
        let isSingleTrans = false;
        let mySqlHelper;
        if (!options.conn) {
            isSingleTrans = true;
            const pool = await this.db();
            mySqlHelper = new mysql_util_1.MySqlUtil(pool);
        }
        if (isSingleTrans) {
            options.conn = await mySqlHelper.start();
        }
        mySqlHelper = new mysql_util_1.MySqlUtil();
        mySqlHelper.setActiveConnection(options.conn);
        try {
            const deleteQuery = `
        UPDATE \`${this.tableName}\`
        SET status = @status
        WHERE id = @id
      `;
            await mySqlHelper.paramExecute(deleteQuery, {
                id: this.id,
                status: (this.status = types_1.DbModelStatus.DELETED)
            }, options.conn);
            this._updateTime = new Date();
            if (isSingleTrans) {
                await mySqlHelper.commit(options.conn);
            }
        }
        catch (err) {
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
    getSelectColumns(table) {
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
    getMappedSelectColumns(table) {
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
    parseMappedSelectColumns(table, data) {
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ id: data[`${table}Id`] ? data[`${table}Id`] : null }, { status: data[`${table}Status`] ? data[`${table}Status`] : null }), { _createTime: data[`${table}CreateTime`] ? data[`${table}CreateTime`] : null }), { _createUser: data[`${table}CreateUser`] ? data[`${table}CreateUser`] : null }), { _updateTime: data[`${table}UpdateTime`] ? data[`${table}UpdateTime`] : null }), { _updateUser: data[`${table}UpdateUser`] ? data[`${table}UpdateUser`] : null });
    }
}
__decorate([
    core_1.prop({
        parser: { resolver: parsers_1.integerParser() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.ALL, types_1.SerializeFor.ADMIN]
    }),
    __metadata("design:type", Number)
], BaseModel.prototype, "id", void 0);
__decorate([
    core_1.prop({
        parser: { resolver: parsers_1.dateParser() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.ADMIN, types_1.SerializeFor.ALL]
    }),
    __metadata("design:type", Date)
], BaseModel.prototype, "_createTime", void 0);
__decorate([
    core_1.prop({
        parser: { resolver: parsers_1.integerParser() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.ADMIN, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.ALL]
    }),
    __metadata("design:type", Number)
], BaseModel.prototype, "_createUser", void 0);
__decorate([
    core_1.prop({
        parser: { resolver: parsers_1.dateParser() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.ADMIN, types_1.SerializeFor.ALL]
    }),
    __metadata("design:type", Date)
], BaseModel.prototype, "_updateTime", void 0);
__decorate([
    core_1.prop({
        parser: { resolver: parsers_1.integerParser() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.ADMIN, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.ALL]
    }),
    __metadata("design:type", Number)
], BaseModel.prototype, "_updateUser", void 0);
__decorate([
    core_1.prop({
        parser: { resolver: parsers_1.integerParser() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.ALL, types_1.SerializeFor.ADMIN, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.INSERT_DB],
        emptyValue: () => types_1.DbModelStatus.ACTIVE,
        defaultValue: () => types_1.DbModelStatus.ACTIVE
    }),
    __metadata("design:type", Number)
], BaseModel.prototype, "status", void 0);
exports.BaseModel = BaseModel;
//# sourceMappingURL=base.model.js.map