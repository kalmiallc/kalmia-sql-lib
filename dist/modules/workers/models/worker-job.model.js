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
exports.WorkerJob = void 0;
const parsers_1 = require("@rawmodel/parsers");
const core_1 = require("@rawmodel/core");
const kalmia_common_lib_1 = require("kalmia-common-lib");
const base_model_1 = require("src/modules/common/base.model");
const types_1 = require("src/config/types");
const mysql_util_1 = require("src/modules/db-connection/mysql-util");
/**
 * Worker job model.
 */
class WorkerJob extends base_model_1.BaseModel {
    constructor() {
        super(...arguments);
        /**
         * Worker jobs table.
         */
        this.tableName = types_1.WorkerDbTables.WORKER_JOB;
    }
    /**
     * Gets pending jobs.
     * @returns Array of pending jobs.
     */
    async getPendingJobs() {
        const pendingJobs = new mysql_util_1.MySqlUtil(await this.db())
            .paramExecute(`
      SELECT * FROM \`${this.tableName}\`
      WHERE status = ${types_1.DbModelStatus.ACTIVE}
      AND nextRun IS NOT NULL
      AND nextRun <= NOW()
      AND (
        lastRun IS NULL
        OR lastRun <= nextRun
        OR DATE_ADD(lastRun, INTERVAL timeout SECOND) < NOW()
      )
    `)
            .then((rows) => rows.map((x) => new WorkerJob(x, this.getContext())));
        return pendingJobs;
    }
    /**
     * Gets worker definition.
     * @returns Worker definition object.
     */
    getWorkerDefinition() {
        if (!this.parameters) {
            this.parameters = {};
        }
        this.parameters.channel = this.channel;
        return Object.assign({}, this.serialize(types_1.SerializeFor.WORKER));
    }
    /**
     * Updates the worker's definition.
     * @param data Worker definition data.
     */
    async updateWorkerDefinition(data) {
        await this.populateById(data.id);
        this.populate(data, types_1.PopulateFor.WORKER);
        await this.update();
    }
}
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", String)
], WorkerJob.prototype, "name", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.integerParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER],
        defaultValue: 1,
        fakeValue: 1
    }),
    __metadata("design:type", Number)
], WorkerJob.prototype, "channel", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER],
        fakeValue: '* * * * * *'
    }),
    __metadata("design:type", String)
], WorkerJob.prototype, "interval", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.dateParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Date)
], WorkerJob.prototype, "lastRun", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.dateParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Date)
], WorkerJob.prototype, "nextRun", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.integerParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER],
        defaultValue: 15 * 60
    }),
    __metadata("design:type", Number)
], WorkerJob.prototype, "timeout", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", String)
], WorkerJob.prototype, "input", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.integerParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER],
        defaultValue: 0,
        fakeValue: 1
    }),
    __metadata("design:type", Number)
], WorkerJob.prototype, "retries", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, kalmia_common_lib_1.JSONParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Object)
], WorkerJob.prototype, "parameters", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.booleanParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Boolean)
], WorkerJob.prototype, "autoRemove", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.integerParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Number)
], WorkerJob.prototype, "lastDuration", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", String)
], WorkerJob.prototype, "lastError", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.dateParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Date)
], WorkerJob.prototype, "lastCompleted", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.dateParser)() },
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB, types_1.SerializeFor.WORKER],
        populatable: [types_1.PopulateFor.DB, types_1.PopulateFor.PROFILE, types_1.PopulateFor.WORKER]
    }),
    __metadata("design:type", Date)
], WorkerJob.prototype, "lastFailed", void 0);
exports.WorkerJob = WorkerJob;
//# sourceMappingURL=worker-job.model.js.map