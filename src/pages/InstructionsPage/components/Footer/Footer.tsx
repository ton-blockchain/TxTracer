import styles from "./Footer.module.css"

function Footer() {
  return (
    <footer className={styles.footer}>
      © {new Date().getFullYear()} TxTracer | TVM Instructions by{" "}
      <a href="https://t.me/toncore" target="_blank" rel="noreferrer">
        TON Core
      </a>
    </footer>
  )
}

export default Footer
