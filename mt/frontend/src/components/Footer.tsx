import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { EXTERNAL_LINKS } from '../links';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.left}>
        <p>Made with love by <a href={EXTERNAL_LINKS.lrmn} target="_blank" rel="noopener noreferrer" className={styles.link}>L RMN</a></p>
      </div>
      <div className={styles.right}>
        <Link to="/privacy" className={styles.link}>Privacy</Link>
        <Link to="/terms" className={styles.link}>Terms</Link>
      </div>
    </footer>
  );
}
