"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downgrade = exports.upgrade = void 0;
const types_1 = require("../../../config/types");
const upgrade = async (queryFn) => {
    await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${types_1.WorkerDbTables.WORKER_LOG}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`status\` INT NOT NULL DEFAULT '${types_1.DbModelStatus.ACTIVE}',
    \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`_createUser\` INT NULL,
    \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`_updateUser\` INT NULL,
    \`workerId\` INT NULL,
    \`workerName\` VARCHAR(45) NULL,
    \`workerType\` VARCHAR(45) NULL,
    \`level\` INT NULL,
    \`message\` VARCHAR(500) NULL,
    \`sourceFunction\` VARCHAR(200) NULL,
    \`data\` JSON NULL,
    PRIMARY KEY (\`id\`))
  `);
};
exports.upgrade = upgrade;
const downgrade = async (queryFn) => {
    await queryFn(`
    DROP TABLE IF EXISTS \`${types_1.WorkerDbTables.WORKER_LOG}\`;
  `);
};
exports.downgrade = downgrade;
//# sourceMappingURL=2-worker-log.js.map