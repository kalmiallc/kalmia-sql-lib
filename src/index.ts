import { MySqlConnManager } from './modules/db-connection/mysql-conn-manager';
import { MySqlUtil } from './modules/db-connection/mysql-util';
import { BaseModel } from './modules/common/base.model';
import { Migrations } from './modules/db-connection/migrations.interface';
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
import { AppLogger } from './modules/logger/app-logger';
import { StandardLogger } from './modules/logger/logger';
import { Context } from './modules/common/context';

import { uniqueFieldValue, enumInclusionValidator } from './modules/common/validators';
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

export {
  MySqlConnManager,
  MySqlUtil,
  BaseModel,
  Migrations,

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
  StandardLogger,
  Context,

  isPlainObject,

  uniqueFieldValue,
  enumInclusionValidator,

  IEnv,
  env
};
