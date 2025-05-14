# TxTracer

TxTracer is a web application designed for tracing and analyzing transactions on the TON (The Open Network) blockchain.
It provides developers and users with tools to visualize and understand transaction flows, inspect contract states, and
debug smart contracts. The application features a code editor for viewing TVM assembly and a user-friendly interface
for navigating complex transactions.

Based on [TxTracer-core](https://github.com/tact-lang/txtracer-core).

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
  - Information about the number of executions of a given line when hovering.
  - Displaying the exit code next to the instruction that threw it.
  - Ability to go to any line by Ctrl/Cmd + Click.
- **Stack Viewer:** View the stack with different colors for different data types.
- **Transaction Details:** Ability to view transaction details, Out Actions, VM, and executor logs.
- **Network Support:** Mainnet and testnet support (with a badge if the transaction is from testnet).
- **Light/Dark Theme:** Switch between light and dark modes for user comfort.

## License

MIT © TON Studio
