import {languages} from "monaco-editor"

export const tolkLanguageDefinition: languages.IMonarchLanguage = {
  defaultToken: "invalid",

  keywords: [
    "tolk",
    "import",
    "global",
    "const",
    "type",
    "struct",
    "fun",
    "get",
    "var",
    "val",
    "return",
    "if",
    "else",
    "while",
    "repeat",
    "do",
    "break",
    "continue",
    "throw",
    "assert",
    "try",
    "catch",
    "match",
    "as",
    "is",
    "lazy",
    "mutate",
    "redef",
    "builtin",
    "asm",
    "true",
    "false",
    "null",
    "self",
  ],

  typeKeywords: ["int", "cell", "slice", "builder", "cont", "tuple"],

  operators: [
    "=",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "<<=",
    ">>=",
    "&=",
    "|=",
    "^=",
    "==",
    "!=",
    "<=",
    ">=",
    "<=>",
    "&&",
    "||",
    "&",
    "|",
    "^",
    "<<",
    ">>",
    "~>>",
    "^>>",
    "-",
    "+",
    "*",
    "/",
    "%",
    "~/",
    "^/",
    "!",
    "~",
    "->",
    "?",
    ":",
    ".",
    "<",
    ">",
  ],

  symbols: /[=><!~?:&|+\-*/^%()[\]{}.,;]+/,

  tokenizer: {
    root: [
      // Comments
      [/\/\/.*$/, "comment"],
      [/\/\*/, {token: "comment", next: "@comment"}],

      // String literals with triple quotes
      [/"""/, {token: "string", next: "@stringTriple"}],

      // Regular string literals
      [/"(?:[^"\\\\n]|\\\\.)*"/, "string"],

      // Annotations
      [/@[a-zA-Z_][a-zA-Z0-9_]*/, "annotation"],

      // Version numbers in tolk directives
      [/(\d+)(.\d+)?(.\d+)?/, "number.version"],

      // Numbers
      [/0x[0-9a-fA-F]+/, "number.hex"],
      [/0b[01]+/, "number.binary"],
      [/\d+/, "number"],

      // Identifiers in backticks
      [/`[^`]+`/, "identifier.backtick"],

      // Function calls
      [/[a-zA-Z_][a-zA-Z0-9_$]*(?=\()/, "identifier.function"],

      // Type identifiers (capitalized)
      [/[A-Z][a-zA-Z0-9_]*/, "type.identifier"],

      // Regular identifiers and keywords
      [
        /[a-zA-Z$_][a-zA-Z0-9$_]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@typeKeywords": "type",
            "@default": "identifier",
          },
        },
      ],

      // Operators
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],

      // Delimiters
      [/[{}]/, "@brackets"],
      [/[[\]]/, "delimiter.square"],
      [/[()]/, "delimiter.parenthesis"],
      [/;/, "delimiter"],
      [/,/, "delimiter"],

      // Underscore
      [/_/, "keyword.underscore"],

      // Whitespace
      [/\s+/, "white"],
    ],

    stringTriple: [
      [/"""/, {token: "string", next: "@pop"}],
      [/[^"]+/, "string"],
      [/"/, "string"],
    ],

    comment: [
      [/[^/*]+/, "comment"],
      [/\/\*/, {token: "comment", next: "@push"}],
      [/\*\//, {token: "comment", next: "@pop"}],
      [/[/*]/, "comment"],
    ],
  },
}
