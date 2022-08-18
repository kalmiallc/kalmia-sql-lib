"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downgrade = exports.upgrade = void 0;
const env_1 = require("../../config/env");
const types_1 = require("../../config/types");
async function upgrade(queryFn) {
    await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${env_1.env.DB_LOGGER_REQUEST_TABLE}\` (
      \`id\` INT NOT NULL UNIQUE AUTO_INCREMENT,
      \`requestId\` VARCHAR(300) NULL,
      \`host\` VARCHAR(300) NULL,
      \`ip\` VARCHAR(45) NULL,
      \`statusCode\` INT NULL,
      \`method\` VARCHAR(10) NULL,
      \`url\` VARCHAR(1000) NULL,
      \`endpoint\` VARCHAR(300) NULL,
      \`userAgent\` VARCHAR(1000) NULL,
      \`origin\` VARCHAR(1000) NULL,
      \`xForwardedFor\` VARCHAR(1000) NULL,
      \`body\` TEXT NULL,
      \`responseTime\` DECIMAL(12,2) NULL,
      \`files\` VARCHAR(3000) NULL,
      \`status\` INT NOT NULL DEFAULT '${types_1.DbModelStatus.ACTIVE}',
      \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`_createUser\` INT NULL,
      \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`_updateUser\` INT NULL,
      PRIMARY KEY (\`id\`)
    );
  `);
}
exports.upgrade = upgrade;
async function downgrade(queryFn) {
    await queryFn(`
    DROP TABLE IF EXISTS \`${env_1.env.DB_LOGGER_REQUEST_TABLE}\`;
  `);
}
exports.downgrade = downgrade;
//# sourceMappingURL=1-request-logs.js.map