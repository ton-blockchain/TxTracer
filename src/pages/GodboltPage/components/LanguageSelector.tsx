import styles from "./LanguageSelector.module.css"

export type CodeLanguage = "func" | "tolk"

interface LanguageSelectorProps {
  readonly value: CodeLanguage
  readonly onChange: (lang: CodeLanguage) => void
}

export default function LanguageSelector({value, onChange}: LanguageSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.segmented} role="group" aria-label="Select language">
        <label className={styles.option}>
          <input
            className={styles.input}
            type="radio"
            name="code-language"
            value="func"
            checked={value === "func"}
            onChange={() => onChange("func")}
          />
          <button
            type="button"
            className={`${styles.button} ${value === "func" ? styles.buttonSelected : ""}`}
            onClick={() => onChange("func")}
          >
            FunC
          </button>
        </label>
        <label className={styles.option}>
          <input
            className={styles.input}
            type="radio"
            name="code-language"
            value="tolk"
            checked={value === "tolk"}
            onChange={() => onChange("tolk")}
          />
          <button
            type="button"
            className={`${styles.button} ${value === "tolk" ? styles.buttonSelected : ""}`}
            onClick={() => onChange("tolk")}
          >
            Tolk <span className={styles.badge}>beta</span>
          </button>
        </label>
      </div>
    </div>
  )
}
