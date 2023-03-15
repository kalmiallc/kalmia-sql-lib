# Kalmia SQL lib
This package contains common sql functions ans connection manager.

This package must be build, and the dist folder is committed. It is done this way because of the NPM build problems. 
To release a new version, npm build must be done (don't forget to update the version in the package.json)

```
npm run build
```

## Public branch

This library also contains public branch. The public branch is separated for the internal and resides in the github. 
The public branch is a separate non-related branch. To commit changes to public branch, each commit must be cherry-picked.
Don't use the merge-feature as it will also move some private keys to the public.


All documentation is MD based and resides in the docs directory.

| Resource                             | Description                                                            |
| ------------------------------------ | ---------------------------------------------------------------------- |
| [Contributing](docs/CONTRIBUTING.md) | Notes to start and deploy this project. And rules for the contribution |
| [Testing](docs/TESTING.md)           | Link to test scenarios, instructions.                                  |
| [Usage](docs/USAGE.md)               | Guide to API usage                                                     |


## People working on the project

Add yourself if you stared to work in this project.

| Person                                    | Role                                |
| ----------------------------------------- | ----------------------------------- |
| Borut Terpinc, Tedej Vengust, Tine Mlakar | Project lead - Oversees the project |
| Jaka Bernard, Anže Mur                    | Developer                           |

