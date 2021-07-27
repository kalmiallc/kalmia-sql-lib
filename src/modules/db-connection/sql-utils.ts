import * as SqlString from 'sqlstring';
import { AppLogger } from '../logger/app-logger';

// eslint-disable-next-line no-shadow
export enum WhereQueryComparator {
  EQUAL,
  LESS_THAN,
  LESS_THAN_OR_EQUAL,
  MORE_THAN,
  MORE_THAN_OR_EQUAL,
  NOT_EQUAL,
  IN,
  NOT_IN,
  HAS_TEXT,
  IN_TEXT
}

export interface SqlQueryObject {
  /**
   * 'Select' part of query
   */
  qSelect: string;
  /**
   * 'From' part of query
   */
  qFrom: string;
  /**
   * 'GROUP' part of query
   */
  qGroup?: string;
  /**
   * 'ORDER BY' and 'LIMIT - OFFSET' part of query
   */
  qFilter?: string;
}

const getOrderField = (name, tableAlias, map = {}) => {
  if (!name) {
    name = 'id';
  }
  if (!map[name]) {
    // SqlString.escape prevents SQL injection!
    return SqlString.escapeId(`${tableAlias ? `${tableAlias}.` : ''}${name}`);
  }
  return map[name];
};

/**
 * Function returns object for database query parameters
 *
 * @export
 * @param defaultParameters  Key-value object. All expected parameters should be listed, value can be null.
 * @param tableAlias table alias name
 * @param fieldMap URL query fields mapped with database query fields.
 * @param urlQuery URL query parameters.
 * @returns Object with parameters for database listing search.
 */
export const getQueryParams = (defaultParameters: any, tableAlias: string, fieldMap: any, urlQuery: any) => {
  const limit = urlQuery.limit === 'NO_LIMIT' ? null : parseInt(urlQuery.limit) || 100;
  const offset = ((parseInt(urlQuery.page) || 1) - 1) * limit;
  const order = [];
  if (urlQuery.orderBy) {
    if (Array.isArray(urlQuery.orderBy)) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < urlQuery.orderBy.length; i++) {
        order.push({
          by: getOrderField(urlQuery.orderBy[i], tableAlias, fieldMap),
          desc: !!(Array.isArray(urlQuery.desc) && urlQuery.desc[i] == 'true')
        });
      }
    } else {
      order.push({
        by: getOrderField(urlQuery.orderBy, tableAlias, fieldMap),
        desc: !!(urlQuery.desc == 'true')
      });
    }
  }

  let orderStr = null;
  for (const o of order) {
    if (orderStr) {
      orderStr += ', ';
    } else {
      orderStr = '';
    }
    orderStr += `${o.by} ${o.desc ? 'DESC' : 'ASC'}`;
  }

  delete urlQuery.page;
  delete urlQuery.limit;
  delete urlQuery.orderBy;
  delete urlQuery.desc;

  return {
    params: {
      ...defaultParameters,
      ...urlQuery
    },
    filters: {
      limit,
      offset,
      order,
      orderStr
    }
  };
};

export const buildSearchParameter = (searchString, fields: string[]) => {
  if (!searchString) {
    return undefined;
  }
  const words = searchString.split(/\s+/g);

  let query = '';

  for (const word of words) {
    // ignore words that are shorter than 2 letter (that is — empty strings and one-letter words)
    if (word.trim().length < 2) {
      continue;
    }
    if (query.length) {
      query += ' AND ';
    }
    const wordEscaped = SqlString.escape(word.trim());
    let queryLinePrefix = '';
    // eslint-disable-next-line guard-for-in
    for (const f in fields) {
      if (+f === 0) {
        // we are adding newline for better readability of debug logs
        queryLinePrefix = `(
        `;
      } else {
        queryLinePrefix = `
        OR `;
      }
      query += `${queryLinePrefix}${fields[f]} LIKE CONCAT('%', ${wordEscaped}, '%')`;
    }
    query += `
    )`;
  }
  return query;
};

export const selectAndCountQuery = async (db: any, queryObj: SqlQueryObject, params: any, countByField: string): Promise<any[]> => {
  const querySelect = [queryObj.qSelect, queryObj.qFrom, queryObj.qGroup, queryObj.qFilter].join('\n');

  const queryCount = `
  SELECT COUNT(*) as total
    FROM (
      SELECT ${countByField || 'id'}
      ${queryObj.qFrom}
      ${queryObj.qGroup ? `GROUP BY ${countByField || 'id'}` : ''}
    ) AS T;
  `;

  // // convert array parameters to sql arrays
  // for (const p in params) {
  //   if (Array.isArray(params[p])) {
  //     let sqlArray = '';
  //     for (let i = 0; i < params[p].length; i++) {
  //       sqlArray = `${i !== 0 ? `${sqlArray}, ` : ''}${SqlString.escape(params[p][i])}`;
  //     }
  //     params[p] = `( ${sqlArray} )`;
  //   }
  // }

  let items: any[];
  let totalResults: any[];
  const workers = [];
  try {
    workers.push(db.paramExecute(querySelect, params).then((res) => (items = res)));
    workers.push(db.paramExecute(queryCount, params).then((res) => (totalResults = res)));
    await Promise.all(workers);
  } catch (err) {
    AppLogger.error('sql-utils.ts', 'selectAndCountQuery', err);
    throw new Error(err);
  }
  const total = totalResults.length ? totalResults[0].total : 0;

  return items;
};

export const unionSelectAndCountQuery = async (db: any, queryObj: any, params: any, countByField: string): Promise<{ items: any[]; total: number }> => {
  let querySelectAll = '';
  let queryCountAll = '';

  for (let i = 0; i < queryObj.qSelects.length; i++) {
    const querySelect = [queryObj.qSelects[i].qSelect, queryObj.qSelects[i].qFrom, queryObj.qSelects[i].qGroup, queryObj.qSelects[i].qFilter].join(
      '\n'
    );
    querySelectAll = `${i !== 0 ? `${querySelectAll}\n\nUNION\n\n` : ''}${querySelect}`;

    queryCountAll = `${i !== 0 ? `${queryCountAll}\n\nUNION\n\n` : ''} SELECT ${countByField || 'id'}
    ${queryObj.qSelects[i].qFrom}
    ${queryObj.qSelects[i].qGroup ? `GROUP BY ${countByField || 'id'}` : ''}`;
  }
  querySelectAll = `${querySelectAll}
    ${queryObj.qFilter}
  `;

  const queryCount = `
  SELECT COUNT(*) as total
    FROM (
      ${queryCountAll}
    ) AS T;
  `;

  // // convert array parameters to sql arrays
  // for (const p in params) {
  //   if (Array.isArray(params[p])) {
  //     let sqlArray = '';
  //     for (let i = 0; i < params[p].length; i++) {
  //       sqlArray = `${i === 0 ? `${sqlArray}, ` : ''}${SqlString.escape(params[p][i])}`;
  //     }
  //     params[p] = `(${sqlArray})`;
  //   }
  // }

  let items: any[];
  let totalResults: any[];
  const workers = [];
  try {
    workers.push(db.paramExecute(querySelectAll, params).then((res) => (items = res)));
    workers.push(db.paramExecute(queryCount, params).then((res) => (totalResults = res)));
    await Promise.all(workers);
  } catch (err) {
    AppLogger.error('sql-utils.ts', 'unionSelectAndCountQuery', err);
    throw new Error(err);
  }
  const total = totalResults.length ? totalResults[0].total : 0;

  return { items, total };
};

export const buildWhereCondition = (comparator: WhereQueryComparator, field: string, param: string) => {
  switch (comparator) {
    case WhereQueryComparator.EQUAL:
      return `${field} = @${param}`;
    case WhereQueryComparator.LESS_THAN:
      return `${field} < @${param}`;
    case WhereQueryComparator.LESS_THAN_OR_EQUAL:
      return `${field} <= @${param}`;
    case WhereQueryComparator.MORE_THAN:
      return `${field} > @${param}`;
    case WhereQueryComparator.MORE_THAN_OR_EQUAL:
      return `${field} >= @${param}`;
    case WhereQueryComparator.NOT_EQUAL:
      return `${field} <> @${param}`;
    case WhereQueryComparator.IN:
      return `${field} IN (@${param})`;
    case WhereQueryComparator.NOT_IN:
      return `${field} NOT IN (@${param})`;
    case WhereQueryComparator.HAS_TEXT:
      return `${field} LIKE '%' + @${param} + '%'`;
    case WhereQueryComparator.IN_TEXT:
      return `@${param} LIKE CONCAT('%', ${field}, '%')`;
    default:
      return '';
  }
};
