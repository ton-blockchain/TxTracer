import styles from "./LanguageSelector.module.css"

type SegmentedOption = Readonly<{value: string; label: string; badge?: string}>

interface CustomSegmentedSelectorProps {
  readonly options: readonly SegmentedOption[]
  readonly value: string
  readonly onChange: (value: string) => void
  readonly ariaLabel?: string
}

export default function CustomSegmentedSelector({
  options,
  value,
  onChange,
  ariaLabel,
}: CustomSegmentedSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.segmented} role="group" aria-label={ariaLabel ?? "Select option"}>
        {options.map(opt => {
          const selected = value === opt.value
          const handleSelect = () => onChange(opt.value)

          return (
            <label key={opt.value} className={styles.option}>
              <input
                className={styles.input}
                type="radio"
                name="segmented-selector"
                value={opt.value}
                checked={selected}
                onChange={handleSelect}
              />
              <button
                type="button"
                className={`${styles.button} ${selected ? styles.buttonSelected : ""}`}
                onClick={handleSelect}
              >
                {opt.label}
                {opt.badge && <span className={styles.badge}>{opt.badge}</span>}
              </button>
            </label>
          )
        })}
      </div>
    </div>
  )
}
