import { Mail, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

export function Navbar({ appName = 'RatioMail' }: { appName?: string }) {
  const location = useLocation();
  return <header className={styles.navbar}><div className={styles.navContainer}><Link to="/" className={styles.logoRow}><div className={styles.logoMark} aria-hidden="true"><Mail size={24} strokeWidth={2.5}/></div><h1 className={styles.title}>{appName}</h1></Link><div className={styles.actions}>{location.pathname !== '/mail' && location.pathname !== '/app' && <Link to="/mail" className="btn btn-secondary">Open RatioMail</Link>}{location.pathname !== '/admin' && <Link to="/admin" className="btn btn-secondary" aria-label="Administrator"><Shield size={16}/></Link>}</div></div></header>;
}
