# Db connection manager
To provide uniform way to connect to database, as MySqlConnManager class shall be used (for MySQL connections). The in general provides a database connection, while enabling developers to set their own.
As it is singleton pattern it will always return just one instance, which make it perfect for proper connection pooling.
Take care not to set too many distinct connections as pools, as the singleton will keep all pools alive until you close them.
Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connections:
- Local pool, AWS RDS, ...

The manager also provides connection to the test database, when the `APP_ENV='testing'˙` is set. In this case the env variables with `_TEST` will be used(ex. `MYSQL_HOST_TEST`).

#### Example of getting the connection
Setting the connection type in .env `PRIMARY_DB=mysql`.

Getting the primary connection:
`await MySqlConnManager.getInstance().getConnection()`

Setting a different connection:
`await MySqlConnManager.getInstance().setConnection(conn)`
where `conn` is your own connection.

The connection is promise based MySql (when using `MySqlConnManager`) or MongoDB (when using `MongoConnManager`).

For sync connections to MySql use:
`MySqlConnManager.getInstance().getConnectionSync()`

### MySql utils
The `MySqlUtil` shall be used for proper database usage. 

Example calling the param query  `MySqlUtil`
```typescript
await (new MySqlUtil(await MySqlConnManager.getInstance().getConnection() as Pool)).paramExecute(
      `SELECT COUNT(*) AS 'COUNT' FROM ${DbCollections.ROLE_PERMISSIONS};`,
    );`
```
