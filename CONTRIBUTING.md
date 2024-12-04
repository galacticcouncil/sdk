# How to contribute

## Requirements

- [Node.js](https://nodejs.org/) (**version 20 or higher**)

## Local development

1. Link local modules

```sh
npm run link
```

2. Build packages

- Build dist (with types)

```sh
npm run build
```

- Build & watch (js only + hot reloading)

```sh
npm run build:watch
```

3. Go to examples and run web dev server

- <a href="./examples/sdk-esm/">SDK Playground</a></br>
- <a href="./examples/xcm-transfer/">XCM Playground</a></br>

```sh
npm run dev
```

For more details visit individual package folder.

## Releasing

1. Run changeset and specify new package version & change summary

Note: If releasing multiple packages, you can run changeset
just once if u wish to share changelog and version type, or
for each package separately (preferred).

```sh
npm run changeset
```

Given a version number MAJOR.MINOR.PATCH, increment the:

- MAJOR version for breaking change (incompatible API changes)
- MINOR version for new feature(s)
- PATCH version for bug fixes

2. Bump version, lockfile & create commit message

```sh
npm run changeset:version
```

3. Build, publish NPM packages & push refs to origin

```sh
npm run release
```
