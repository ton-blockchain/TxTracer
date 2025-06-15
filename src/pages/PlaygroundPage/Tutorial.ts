import type {TutorialStep} from "@shared/ui/Tutorial"

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Assembly Playground",
    content:
      "This tool lets you write and execute TON Assembly (TVM) code step by step.\n\nPerfect for learning TVM instructions and debugging smart contracts!\n\nPress Esc to close this tutorial at any time.",
    target: "",
    placement: "bottom",
  },
  {
    title: "Assembly Code Editor",
    content:
      "Write your TVM assembly instructions here.\n\nEach line represents one instruction that will be executed by the TVM.",
    target: `[class*="mainContent"] > div:first-child`,
    placement: "right",
  },
  {
    title: "Execute Your Code",
    content:
      "Click Execute or press Ctrl+Enter to run your assembly code.\n\nThe execution will start and you'll see step-by-step results.",
    target: '[role="toolbar"] button:first-child',
    placement: "bottom",
  },
  {
    title: "Trace Panel & Navigation",
    content:
      "This panel shows step-by-step execution trace.\n\nUse First/Prev/Next/Last buttons to navigate through each instruction.\n\nClick on line numbers with Ctrl/Cmd in the editor to jump to specific execution steps.",
    target: `[class*="mainContent"] > div:last-child`,
    placement: "left",
  },
  {
    title: "Gas Usage Tracking",
    content:
      "Each TVM instruction consumes gas (computational cost).\n\nThe 'Used gas' counter shows cumulative gas consumption up to the current step.",
    target: '[data-testid="cumulative-gas-counter"]',
    placement: "left",
  },
  {
    title: "Stack Visualization",
    content:
      "The stack shows current state of the TVM stack.\n\nTVM is a stack-based virtual machine - most operations work with stack elements.\n\nWatch how instructions push/pop values to/from the stack.",
    target: `[class*="mainContent"] > div:last-child`,
    placement: "left",
  },
  {
    title: "Initial Stack Setup",
    content:
      "Before executing code, you can set up an initial stack.\n\nThis is useful for testing functions that expect specific input values.",
    target: `[class*="stack-viewer"]`,
    placement: "left",
  },
  {
    title: "Ready to Code!",
    content:
      "You're all set! Try modifying the example code or write your own.\n\nExperiment with different TVM instructions to learn how they work.\n\nHappy debugging! 🚀",
    target: '[role="toolbar"]',
    placement: "bottom",
  },
]
