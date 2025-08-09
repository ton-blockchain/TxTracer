## Contributing to TxTracer

Thank you for contributing! This guide shows how to set up the project, build it, run it locally, test, and lint.

### Requirements

- Node.js 22.x (use `nvm`/`fnm`/`volta` to manage versions)
- Yarn (Classic 1.x or Berry)
- For e2e tests: Playwright browsers installed

### Setup

```bash
git clone https://github.com/ton-blockchain/TxTracer
cd TxTracer
yarn install
```

### Run locally

Start the dev server (Vite) at `http://localhost:5174`:

```bash
yarn dev
```

Preview the production build:

```bash
yarn build
yarn preview
```

### Build

TypeScript build + Vite bundle:

```bash
yarn build
```

Artifacts are emitted into `dist/`.

### Tests

- Unit tests:

```bash
yarn test
```

- E2E tests (Playwright). The config will start the dev server automatically.

Install Playwright browsers once:

```bash
npx playwright install --with-deps
```

And then run:

```bash
yarn test:e2e
```

### Lint & format

- Lint:

```bash
yarn lint
```

- Auto-fix and format:

```bash
yarn fmt
yarn lint --fix
```

- Check formatting without changes:

```bash
yarn fmt:check
```

### Before commit/PR

Quick checklist:

- Run formatter and linter: `yarn fmt && yarn lint --fix` or simply `yarn precommit`
- Run tests: `yarn test` and `yarn test:e2e`
- Ensure it builds: `yarn build`

The `yarn precommit` script runs formatting, lint fixes, and a production build.

Thanks for your help and good luck!
