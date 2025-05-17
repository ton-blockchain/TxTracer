# TxTracer

TxTracer is a web application designed for tracing and analyzing transactions on the TON (The Open Network) blockchain.
It provides developers and users with tools to visualize and understand transaction flows, inspect contract states, and
debug smart contracts. The application features a code editor for viewing TVM assembly and a user-friendly interface
for navigating complex transactions.

Based on [TxTracer-core](https://github.com/tact-lang/txtracer-core).

![cover.png](docs/cover.png)

## Features

- **Transaction Tracing:** Visualize and step through TON transaction execution.
- **Contract Interaction:** Inspect contract details and messages.
- **Detailed Cell Inspector:** Explore TON cells from the stack in a hierarchical tree view. Ability to look at
  Cell/Slice/Builder/Address as a Cell tree with the ability to collapse subtrees, as well as copy any of its parts as
  BoC hex.
- **Code Viewer & Inspector:** View TVM assembly code with execution counts, gas usage, and detailed instruction
  documentation on hover.
  - Code editor with highlighting.
  - Hover documentation for instructions.
  - Number of executions of a given line on hover.
  - Exit code next to the instruction that threw it.
  - Go to any line by Ctrl/Cmd + Click.
- **Stack Viewer:** View the stack with different colors for different data types.
- **Transaction Details:** View transaction details, Out Actions, VM, and executor logs.
- **Network Support:** Mainnet and testnet support (with a badge if the transaction is from the testnet).
- **Light/Dark Theme:** Switch between light and dark themes.

## How to use

Go to https://txtracer.ton.org/, enter the transaction hash or transaction link from explorer,
click the "Trace" button, and start diving into the contract!

TxTracer supports links from the following explorers:

- `https://ton.cx`
- `https://tonviewer.com`
- `https://tonscan.org`
- `https://explorer.toncoin.org`
- `https://dton.io`

If you want to share a link to a specific transaction, you can add the `tx` parameter:

https://txtracer.ton.org/?tx=60e5cd74c32c1ccd193599a9ebee6cae33f5e76d9ba29031d0bf3adb4ab37363

### Transactions to play with

If you just want to try TxTracer, here are some interesting transactions:

- [Out of gas exception](https://txtracer.ton.org/?tx=64ec9aa3d0515783fc32e8ecf741e00815d82396752a0ac6aef367483acd6908)
- [Huge contract](https://txtracer.ton.org/?tx=041293cf00939d8df12badbdf6ab9e2091c8121941dbb170c543595403b5b97b)
- [Skipped compute phase](https://txtracer.ton.org/?tx=654fc2160a3ad81ef05803e99fcec13a9a309e937bacbd0534e4dbee018ca594)
- [Deep cells](https://txtracer.ton.org/?tx=f8b7a5b598c65ecb180338eec103bf28c199bf8346453342eb7022ccf2ea39f6)

## Inspiration

This project is heavily inspired by [retracer](https://retracer.ton.org/).

## License

MIT © TON Studio
