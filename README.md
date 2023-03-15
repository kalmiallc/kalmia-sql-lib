# Kalmia SQL lib
This package contains common sql functions and connection manager.

This package must be build, and the dist folder is committed. It is done this way because of the NPM build problems.
To release a new version, npm build must be done (don't forget to update the version in the package.json)

```
npm run build
```

This library is open source, licensed under [MIT License](./LICENSE.md)

## Usage

This library is not necessary published to npm. To use it in your package use: git+ssh, git+https.
Library is also published pre-compiled (dist included).

## Structure

The logic for this backend project is contained in `/src` directory. Code is split into modules. Every module has it's own set of tests.
On the `/src` level the following directory structure shall be used:

| Directory         | Description                                              |
| ----------------- | -------------------------------------------------------- |
| config            | Configuration of environment, enums, error messages etc. |
| migration-scripts | Database migration files. (migration and seed files).    |
| modules           | Modules - each module is a set of functionality.         |

Directory structure for modules is as follows:

| Directory | Description                     |
| --------- | ------------------------------- |
| /         | Module code files               |
| tests     | Module tests                    |
| models    | Data models used in the module. |

When coding, avoid global functions. All function, except explicit really global ones as `isPlainObject` should be wrapped in it's own class.
All commonly used functions shall be put into `common` module. The model base classes shall be put into the `model-base` module.

For the methods which don't involve instance state, use static modifier.

## Modules

Structure of every package is separated into modules. Module also contains tests for that module. One module should represent one closed functionally. For example all things concerning logging shall be in the logging module.
The common module shall contain all the common helper functions, common errors (exceptions), common tools.

## Contributions

Any contribution to the library must be created on it's own branch with new pull request. Test should cover most of the functionalities.
Contribution will be reviewed and added to new version release if applicable.