Project specific testing guides are here.

A general [testing guides](https://bitbucket.org/kalmiadevs/kalmia-common-lib/src/master/docs/TESTING.md) are a must read, and shall not be duplicated here. 


Tests can be run from the docker files or directly with the npm test. If docker file is used, make sure that the `.env.test` is properly setup.

```bash
# build Docker image
sudo AUTH_REPO_ACCESS_KEY="$(cat kalmia-auth-repo-access.key)" docker-compose -f docker-compose.test.yaml --env-file ./.env.test build --force

# run docker image
sudo  docker-compose -f docker-compose.test.yaml --env-file ./.env.test up --force-recreate --abort-on-container-exit --exit-code-from sql-lib
```


To test with npm test, first run the docker sql instance:

```bash
# run just a single service (mysql is usually needed)
docker-compose -f docker-compose.test.yaml up -d mysqldb
docker-compose -f docker-compose.test.yaml up mysqldb
```

and then 

```
npm run test
```