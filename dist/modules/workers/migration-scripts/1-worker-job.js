"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downgrade = exports.upgrade = void 0;
const types_1 = require("../../../config/types");
const upgrade = async (queryFn) => {
    await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${types_1.WorkerDbTables.WORKER_JOB}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`status\` INT NOT NULL DEFAULT '${types_1.DbModelStatus.ACTIVE}',
    \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`_createUser\` INT NULL,
    \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`_updateUser\` INT NULL,
    \`name\` VARCHAR(45) NOT NULL,
    \`channel\` INT NULL,
    \`interval\` VARCHAR(45) NULL,
    \`lastRun\` DATETIME NULL,
    \`nextRun\` DATETIME NULL,
    \`timeout\` INT NULL,
    \`input\` VARCHAR(300) NULL,
    \`retries\` INT NULL,
    \`parameters\` JSON NULL,
    \`autoRemove\` TINYINT NULL DEFAULT false,
    \`lastDuration\` INT NULL,
    \`lastError\` TEXT NULL,
    \`lastCompleted\` DATETIME NULL,
    \`lastFailed\` DATETIME NULL,
    PRIMARY KEY (\`id\`))
  `);
};
exports.upgrade = upgrade;
const downgrade = async (queryFn) => {
    await queryFn(`
    DROP TABLE IF EXISTS \`${types_1.WorkerDbTables.WORKER_JOB}\`;
  `);
};
exports.downgrade = downgrade;
//# sourceMappingURL=1-worker-job.js.map