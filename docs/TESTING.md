Project specific testing guides are here.

A general [testing guides](https://bitbucket.org/kalmiadevs/kalmia-common-lib/src/master/docs/TESTING.md) are a must read, and shall not be duplicated here. 


```bash
# build Docker image
sudo AUTH_REPO_ACCESS_KEY="$(cat kalmia-auth-repo-access.key)" docker-compose -f docker-compose.test.yaml --env-file ./.env.test build --force

# run docker image
sudo AUTH_REPO_ACCESS_KEY="$(cat kalmia-auth-repo-access.key)" docker-compose -f docker-compose.test.yaml --env-file ./.env.test up --force-recreate --abort-on-container-exit --exit-code-from 
```
