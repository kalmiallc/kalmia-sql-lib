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
exports.WorkerLog = void 0;
/* eslint-disable @typescript-eslint/member-ordering */
const core_1 = require("@rawmodel/core");
const parsers_1 = require("@rawmodel/parsers");
const types_1 = require("../../../config/types");
const base_model_1 = require("../../common/base.model");
/**
 * Worker log model.
 */
class WorkerLog extends base_model_1.BaseModel {
    constructor() {
        super(...arguments);
        /**
         * Worker logs table.
         */
        this.tableName = types_1.WorkerDbTables.WORKER_LOG;
    }
}
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.integerParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", Number)
], WorkerLog.prototype, "workerId", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", Number)
], WorkerLog.prototype, "workerName", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", String)
], WorkerLog.prototype, "workerType", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.integerParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", Number)
], WorkerLog.prototype, "level", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", String)
], WorkerLog.prototype, "message", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", String)
], WorkerLog.prototype, "sourceFunction", void 0);
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        populatable: [types_1.PopulateFor.DB],
        serializable: [types_1.SerializeFor.INSERT_DB]
    }),
    __metadata("design:type", String)
], WorkerLog.prototype, "data", void 0);
exports.WorkerLog = WorkerLog;
//# sourceMappingURL=worker-log.model.js.map