import styles from "./Footer.module.css"

function Footer() {
  return (
    <footer className={styles.footer}>
      © {new Date().getFullYear()} TxTracer | TVM Instructions by TON Core
    </footer>
  )
}

export default Footer
