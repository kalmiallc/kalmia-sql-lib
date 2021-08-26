import { MySqlConnManager } from './modules/db-connection/mysql-conn-manager';
import { MySqlUtil } from './modules/db-connection/mysql-util';
import { BaseModel } from './modules/common/base.model';
import { Migrations, MigrationOptions } from './modules/migrations/migrations';
import {
  LoggerType,
  LogType,
  ConnectionStrategy,
  ApplicationEnv,
  PopulateFor,
  SerializeFor,
  DbConnectionType,
  IConnectionDetails,
  DbModelStatus
} from './config/types';
import { AppLogger, IAppLogger } from './modules/logger/app-logger';
import { StandardLogger } from './modules/logger/logger';
import {
  uniqueFieldWithIdValidator,
  uniqueFieldValidator,
  enumInclusionValidator,
  conditionalPresenceValidator,
  foreignKeyExistence
} from './modules/common/validators';
import { JSONParser } from './modules/common/parsers';
import { isPlainObject } from './modules/common/utils';
import {
  WhereQueryComparator,
  SqlQueryObject,
  getQueryParams,
  buildSearchParameter,
  selectAndCountQuery,
  unionSelectAndCountQuery,
  buildWhereCondition
} from './modules/db-connection/sql-utils';
import { IEnv, env } from './config/env';
import { MySqlStage } from './modules/test-helpers/mysql-stage';

export {
  MySqlConnManager,
  MySqlUtil,
  BaseModel,
  Migrations,
  MigrationOptions,

  WhereQueryComparator,
  SqlQueryObject,
  getQueryParams,
  buildSearchParameter,
  selectAndCountQuery,
  unionSelectAndCountQuery,
  buildWhereCondition,

  LoggerType,
  LogType,
  ConnectionStrategy,
  ApplicationEnv,
  PopulateFor,
  SerializeFor,
  DbConnectionType,
  IConnectionDetails,
  DbModelStatus,

  AppLogger,
  IAppLogger,
  StandardLogger,

  isPlainObject,

  uniqueFieldWithIdValidator,
  uniqueFieldValidator,
  enumInclusionValidator,
  conditionalPresenceValidator,
  JSONParser,
  foreignKeyExistence,

  IEnv,
  env,

  MySqlStage,
};
