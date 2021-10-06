# This is dockerfile for the API projects
# ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
# ▌ STEP 1: BUILD
# ▌ Used for building APP.
# ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
FROM node:16-alpine as build

# ╒═════════════════════════
# │ Enviroment & args
# ╘═════════════════════════

RUN apk add --no-cache git openssh
# Prepare files to get version
COPY package.json ./
COPY .git ./

ENV PACKAGE_VERSION '0.0.0'
ENV PACKAGE_NAME 'unknown'
ENV BUILD_VERSION 'unknown'
RUN export PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
RUN export PACKAGE_NAME=$(node -p -e "require('./package.json').name")
RUN export BUILD_VERSION=$(git rev-parse HEAD)

ENV RELEASE="$PACKAGE_VERSION-$BUILD_NUMBER-$BUILD_VERSION"

RUN rm -rf package.json .git

# Prepare readonly ssh access to repo. 
RUN mkdir ~/.ssh 
ARG AUTH_REPO_ACCESS_KEY
RUN echo "${AUTH_REPO_ACCESS_KEY}" > ~/.ssh/id_ed25519
RUN chmod 600 ~/.ssh/id_ed25519
RUN ssh-keyscan bitbucket.org >> ~/.ssh/known_hosts
RUN ssh -T git@bitbucket.org && if [ $? -eq 0 ]; then echo 'TEST OK'; else echo 'NO ACCESS TO REPO'; exit 1; fi;

# ╒═════════════════════════
# │ BUILD APP
# ╘═════════════════════════

# Add the source files, build and verify the project
ADD . .
RUN export BUILD_COMMIT=$(git rev-parse HEAD)
RUN echo 'Making build on commit ${AUTH_REPO_ACCESS_KEY}' 
RUN npm i --no-save
RUN mv dist dist-old
RUN npm run build

# This phase is skipped as it should be run from the docker compose file.
# CMD ["npm", "run test"]
