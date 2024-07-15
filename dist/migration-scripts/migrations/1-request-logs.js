"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgrade = upgrade;
exports.downgrade = downgrade;
const env_1 = require("../../config/env");
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
      \`data\` JSON NULL,
      \`responseTime\` DECIMAL(12,2) NULL,
      \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    );
  `);
}
async function downgrade(queryFn) {
    await queryFn(`
    DROP TABLE IF EXISTS \`${env_1.env.DB_LOGGER_REQUEST_TABLE}\`;
  `);
}
//# sourceMappingURL=1-request-logs.js.map