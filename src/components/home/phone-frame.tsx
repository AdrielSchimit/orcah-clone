import styles from "./phone-frame.module.css";

export function PhoneFrame({
  children,
  className = "",
  screenClassName = "bg-paper",
}: {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div
      className={`${styles.frame} ${className}`}
    >
      <div className={`${styles.screen} ${screenClassName}`}>
        <div className={styles.header}>
          <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H5v20h14V7Z" /><path d="M14 2v6h5M8 12h8M8 16h8" /></svg></span>
          <div><strong>Sua página profissional</strong><small>pintura-norte.orcah.com.br</small></div>
        </div>
        {children}
      </div>
      <div className={styles.bar} aria-hidden="true" />
    </div>
  );
}
