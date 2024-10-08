"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgrade = upgrade;
exports.downgrade = downgrade;
const env_1 = require("../../config/env");
async function upgrade(queryFn) {
    await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${env_1.env.DB_LOGGER_TABLE}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`ts\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`file\` VARCHAR(1000) NULL,
      \`method\` VARCHAR(1000) NULL,
      \`severity\` VARCHAR(255) NULL,
      \`data\` TEXT NULL,
      PRIMARY KEY (\`id\`));
    `);
}
async function downgrade(queryFn) {
    await queryFn(`
    DROP TABLE IF EXISTS \`${env_1.env.DB_LOGGER_TABLE}\`;
  `);
}
//# sourceMappingURL=0-db-log.js.map