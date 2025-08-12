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
      "The left panel is where you write your FunC code.\n\nYou can modify the example or write your own smart contract from scratch.\n\nHover over code lines to see their corresponding assembly output.\n\nBy default, if you change the code, it will be automatically compiled, this can be disabled in settings.",
    target: '[aria-labelledby="func-editor-heading"]',
    placement: "right",
  },
  {
    title: "Compile Your Code",
    content:
      "Code is automatically compiled when you open the page and when you make changes.\n\nTo compile code manually, click the 'Compile' button or press Ctrl+Enter.",
    target: '[role="toolbar"] button:first-child',
    placement: "bottom",
  },
  {
    title: "View Assembly Output",
    content:
      "The right panel shows the compiled assembly code.\n\nMatching colors between FunC and assembly indicate corresponding code sections.\n\nHover over lines to see interactive connections - when hovering specific assembly lines, related parts within a single line will be highlighted in FunC code.",
    target: '[aria-labelledby="asm-editor-heading"]',
    placement: "left",
  },
  {
    title: "Share Your Code",
    content:
      "Use the share button to generate links to your code.\n\nPerfect for collaboration, asking for help, or showcasing your smart contracts!",
    target: '[role="toolbar"] button:nth-child(2)',
    placement: "bottom",
  },
  {
    title: "Customize Settings",
    content:
      "Click the settings button to customize your experience:\n\n• Show variables on hover\n• Display instruction documentation\n• Enable auto-compile on code changes\n\nThese options help tailor the editor to your needs.",
    target: '[aria-label="Open settings menu"]',
    placement: "bottom",
  },
  {
    title: "Switch Languages",
    content:
      "Use the selector in the header to switch between FunC and Tolk. Your choice and code are saved between sessions, and compilation runs automatically when switching.\n\nNote that Tolk support here is still in beta and may not work as expected.",
    target: '[aria-label="Select language"]',
    placement: "bottom",
  },
  {
    title: "Ready to Code!",
    content:
      "You're all set! You now know how to:\n\n• Write and compile FunC code\n• Analyze assembly output\n• Customize settings for your workflow\n• Share your code with others\n\nHappy smart contract development! 🚀",
    target: '[role="toolbar"]',
    placement: "bottom",
  },
]
