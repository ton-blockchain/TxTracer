const SUB_CATEGORIES_DISPLAY_NAMES: Record<string, string> = {
  all: "All",
  add_mul: "Addition and Multiplication",
  address: "Address Operations",
  basic_gas: "Basic Gas Operations",
  cell_cmp: "Cell Comparison",
  cell_const: "Cell Constants",
  cell_deserialize: "Cell Deserialization",
  cell_serialize: "Cell Serialization",
  codepage: "Codepage Management",
  config: "Config Access",
  continuation_change: "Continuations: Changes",
  continuation_cond: "Continuations: Conditionals",
  continuation_cond_loop: "Continuations: Loops",
  continuation_dict_jump: "Continuations: Dictionary Jumps",
  continuation_jump: "Continuations: Jumps",
  crypto_bls: "Crypto: BLS",
  crypto_rist255: "Crypto: RIST255",
  crypto_common: "Crypto: Common",
  debug: "Debugging",
  dictionary: "Dictionary Operations",
  div: "Division",
  exception: "Exceptions",
  int_cmp: "Integer Comparison",
  int_const: "Integer Constants",
  message: "Message Operations",
  misc: "Miscellaneous",
  other_arith: "Other Arithmetic",
  prng: "Randomness (PRNG)",
  shift_logic: "Bit Shifts and Logic",
  stack: "Stack Manipulation",
  tuple: "Tuple Operations",
}

const CATEGORIES_DISPLAY_NAMES: Record<string, string> = {
  all: "All",
  arithmetic: "Arithmetic",
  cell: "Cells",
  continuation: "Continuations",
  globals: "Globals",
  crypto: "Crypto",
}

export function prettySubCategoryName(categoryKey: string): string {
  if (!categoryKey) return ""
  const key = categoryKey === "All" ? "all" : categoryKey
  return (
    SUB_CATEGORIES_DISPLAY_NAMES[key] ??
    CATEGORIES_DISPLAY_NAMES[key] ??
    fallbackPrettyCategoryName(categoryKey)
  )
}

function fallbackPrettyCategoryName(categoryKey: string): string {
  return categoryKey
    .split("_")
    .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}
