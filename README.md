# Instagram Scraper

- Get Instagram profile from public webpages.

## Configuration

- cp config/zproxy.json.example config/zproxy.json

## Technology

- Node
  - Node Version Manager Tool - [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
  - Node Version: 18.1.0
- [Puppeteer](https://pptr.dev/)
  - Node library which provides a high-level API to control Chrome
- Proxy: Residential Zone
- Typescript
  - TypeScript is JavaScript with syntax for types. [Doc](https://www.typescriptlang.org/)
  - [Node.Js With TypeScript](https://nodejs.dev/en/learn/nodejs-with-typescript/)

## Structure

```
  build
    └── index.js
    └── ...
  config
    └── config.json
    └── zproxy.json
  src
    └── api
        ├── routes.ts
    └── pages
        ├── identifiers.ts
        ├── index.ts
        ├── parse.ts
        ├── userTemplate.ts
    └── environment
        ├── config.ts
        ├── zproxy.ts
    └── utils
        ├── index.ts
        ├── ipConfig.ts
        ├── scrapedLogger.ts
    └── index.ts
  types
    └── index.d.ts
```

- `build`: The latest generated javascript code.
- `config`: Configuration.
- `src`: The main coding part of the scraper, written by typescript.
- `types`: Type or Interface definition.

## Scripts Overview

```NodeJS
npm run start:dev
```

Starts the application in development using nodemon and ts-node to do cold reloading.

```NodeJS
npm run build
```

Builds the app at build, cleaning the folder first.

```NodeJS
npm run start
```

Starts the app in production by first building the project with `npm run build`, and then executing the compiled JavaScript at `build/index.js`.

## Usage Examples

```NodeJS
env HEADLESS=false TEST_IDS=instagram,cristiano,kyliejenner node build/index.js
```

## Contributors

- [Encore Shao](https://github.com/encoreshao)
