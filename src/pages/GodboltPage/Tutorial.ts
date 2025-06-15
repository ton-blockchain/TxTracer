import type {TutorialStep} from "@shared/ui/Tutorial"

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to Code Explorer",
    content:
      "This tool helps you compile and analyze FunC smart contracts. Let's walk through the main features step by step!\n\nPress Esc to close this tutorial at any time.",
    target: "",
    placement: "bottom",
  },
  {
    title: "Write Your Code",
    content:
      "The left panel is where you write your FunC code.\n\nYou can modify the example or write your own smart contract from scratch.",
    target: '[aria-labelledby="func-editor-heading"]',
    placement: "right",
  },
  {
    title: "Compile Your Code",
    content:
      "Click the 'Compile' button or press Ctrl+Enter to compile your code.\n\nThe results will appear in the right panel.",
    target: '[role="toolbar"] button:first-child',
    placement: "bottom",
  },
  {
    title: "View Assembly Output",
    content:
      "The right panel shows the compiled assembly code.\n\nHover over lines to see interactive connections with your FunC source code.",
    target: '[aria-labelledby="asm-editor-heading"]',
    placement: "left",
  },
  {
    title: "Settings & Sharing",
    content:
      "Use the settings menu to customize your experience.\n\nThe share button generates links to your code that you can share with others.\n\nHappy coding! 🚀",
    target: '[role="toolbar"]',
    placement: "bottom",
  },
]
