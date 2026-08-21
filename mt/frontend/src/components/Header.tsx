import { Mail } from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  appName: string;
  mailDomain: string;
}

export function Header({ appName, mailDomain }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logoRow}>
        <div className={styles.logoMark} aria-hidden="true">
          <Mail size={28} strokeWidth={2.5} />
        </div>
        <h1 className={styles.title}>{appName}</h1>
      </div>
      <p className={styles.subtitle}>
        Disposable inbox for <strong>@{mailDomain}</strong>
      </p>
    </header>
  );
}
