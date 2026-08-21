import { Mail } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export function Navbar({ appName = "MailTune" }: { appName?: string }) {
  const location = useLocation();

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logoRow}>
          <div className={styles.logoMark} aria-hidden="true">
            <Mail size={24} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>{appName}</h1>
        </Link>
        
        <div className={styles.actions}>
          {location.pathname !== '/app' && (
            <Link to="/app" className="btn btn-secondary">
              Open App
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
