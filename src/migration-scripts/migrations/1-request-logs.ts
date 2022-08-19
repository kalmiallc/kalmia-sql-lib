import { env } from '../../config/env';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${env.DB_LOGGER_REQUEST_TABLE}\` (
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

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${env.DB_LOGGER_REQUEST_TABLE}\`;
  `);
}
