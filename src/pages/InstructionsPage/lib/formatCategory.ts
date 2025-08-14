const DISPLAY_NAMES: Record<string, string> = {
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
  continuation_change: "Continuation Change",
  continuation_cond_loop: "Continuation: Conditional",
  continuation_dict_jump: "Continuation: Dictionary Jump",
  continuation_jump: "Continuation: Jump",
  crypto: "Cryptography",
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

export function prettyCategoryName(categoryKey: string): string {
  if (!categoryKey) return ""
  const key = categoryKey === "All" ? "all" : categoryKey
  return DISPLAY_NAMES[key] ?? fallbackPrettyCategoryName(categoryKey)
}

function fallbackPrettyCategoryName(categoryKey: string): string {
  return categoryKey
    .split("_")
    .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ")
}
