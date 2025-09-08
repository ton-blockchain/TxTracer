# TxTracer Components

A React component library for TON blockchain transaction analysis and visualization.

**⚠️ TypeScript Required**: This library is published as TypeScript source files and requires TypeScript in your
project.

## Installation

```bash
npm install txtracer-components-test-dev
# or
yarn add txtracer-components-test-dev
```

## Requirements

- TypeScript >= 4.5
- React >= 18.0.0
- A bundler that supports TypeScript (Vite, Webpack, etc.)

## Usage

### Import Components

```tsx
import {Button, CodeEditor, DataBlock} from "txtracer-components-test-dev"
import {useSandboxData} from "txtracer-components-test-dev/features"
import "txtracer-components-test-dev/styles"
```

### TypeScript Configuration

Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "jsx": "react-jsx"
  }
}
```

## Peer Dependencies

- React >= 18.0.0
- React DOM >= 18.0.0

## Development

This library is built with:

- React
- TypeScript
- Vite
- CSS Modules

## License

MIT © TON Studio & TON Core
