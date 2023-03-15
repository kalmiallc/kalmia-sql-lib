"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downgrade = exports.upgrade = void 0;
const env_1 = require("../../config/env");
async function upgrade(queryFn) {
    await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${env_1.env.DB_LOGGER_WORKER_TABLE}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`ts\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`status\` VARCHAR(100) NULL,
      \`worker\` VARCHAR(100) NULL,
      \`message\` TEXT NULL,      
      \`data\` JSON NULL,
      \`error\` JSON NULL,
      \`uuid\` VARCHAR(45) NULL,
      PRIMARY KEY (\`id\`));
    `);
}
exports.upgrade = upgrade;
async function downgrade(queryFn) {
    await queryFn(`
    DROP TABLE IF EXISTS \`${env_1.env.DB_LOGGER_WORKER_TABLE}\`;
  `);
}
exports.downgrade = downgrade;
//# sourceMappingURL=2-worker-log.js.map