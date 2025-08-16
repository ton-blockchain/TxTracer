import type {TutorialStep} from "@shared/ui/Tutorial"

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Playground",
    content:
      "This tool lets you write and execute TON Assembly (TASM) and FunC code step by step.\n\nPerfect for learning TVM instructions and debugging smart contracts!\n\nPress Esc to close this tutorial at any time.",
    target: "",
    placement: "bottom",
  },
  {
    title: "Assembly Code Editor",
    content:
      "Here you can write your TVM assembly instructions.\n\nEach line represents one instruction that will be executed by the TVM.\n\nThe default code shows basic stack operations - feel free to modify it!",
    target: `[class*="mainContent"] > div:first-child`,
    placement: "right",
  },
  {
    title: "Initial Stack Setup",
    content:
      "Before executing code, you can set up an initial stack with test values.\n\nThis is useful for testing functions that expect specific inputs.",
    target: `[class*="stack-viewer"]`,
    placement: "left",
  },
  {
    title: "Add Elements onto the Stack",
    content:
      "Click + button to add elements onto the Stack one by one, or click Import button to insert the entire stack from VM logs",
    target: `[class*="stack-header-actions"]`,
    placement: "left",
  },
  {
    title: "Execute Your Code",
    content:
      "I'll automatically execute the code for you to demonstrate the trace functionality.\n\nClick Execute manually or press Ctrl+Enter to run your assembly code.",
    target: '[role="toolbar"] button:first-child',
    placement: "bottom",
    autoAction: {
      type: "click",
      selector: '[role="toolbar"] button:first-child',
      delay: 400,
    },
  },
  {
    title: "Execution Status",
    content:
      "The status badge shows if the execution succeeded or failed.\n\n• Green badge - Successful execution (exit code 0)\n• Red badge - Failed execution (non-zero exit code)\n\nExit codes help identify what went wrong in the code.",
    target: '[role="status"]',
    placement: "bottom",
  },
  {
    title: "Great! Code Executed",
    content:
      "Perfect! The code execution completed successfully.\n\nOn the right panel, you can now view the initial stack state before the first instruction execution.",
    target: `[class*="mainContent"] > div:last-child`,
    placement: "left",
  },
  {
    title: "Navigate Through Steps",
    content:
      "Use the navigation buttons to step through your code execution.\n\nI'll automatically click the 'Next' button to show you how the stack changes.\n\nWatch the stack section below!",
    target: `[class*="navigation-controls"]`,
    placement: "left",
    autoAction: {
      type: "click",
      selector: '[data-testid="next-step-button"]',
      delay: 400,
    },
  },
  {
    title: "Gas Usage Tracking",
    content:
      "Notice how the gas counter increased!\n\nEach TVM instruction consumes gas (computational cost).\n\nThis helps you optimize your smart contracts for efficiency.",
    target: '[data-testid="cumulative-gas-counter"]',
    placement: "left",
  },
  {
    title: "Stack Visualization",
    content:
      "Look at the stack section below - see how values changed!\n\nTVM is a stack-based virtual machine. Instructions push/pop values to/from the stack.\n\nTry clicking Next/Prev buttons to see the stack evolve.",
    target: `[class*="stack-viewer"]`,
    placement: "left",
  },
  {
    title: "Switch to FunC (beta)",
    content:
      "You can switch between Assembly and FunC using this segmented control.\n\nSelect FunC (beta) to write high-level code and see the compiled assembly alongside.\n\nMapping highlight and stepping by source lines are available in FunC mode.",
    target: `[class*="languageSwitcher"]`,
    placement: "bottom",
  },
  {
    title: "Share Your Code",
    content:
      "Use the share button to generate links to your code.\n\nPerfect for collaboration, asking for help, or showcasing your smart contracts!",
    target: '[role="toolbar"] button:nth-child(2)',
    placement: "bottom",
  },
  {
    title: "Ready to Code!",
    content:
      "You're all set! You now know how to:\n\n• Write assembly code\n• Execute and debug step by step\n• Monitor gas usage and stack changes\n• Set up initial test conditions\n\nTry modifying the code or writing your own code.\n\nHappy debugging! 🚀",
    target: '[role="toolbar"]',
    placement: "bottom",
  },
]
