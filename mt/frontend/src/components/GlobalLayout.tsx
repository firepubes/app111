import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import styles from './GlobalLayout.module.css';
import { useConfig } from '../hooks/useConfig';

export function GlobalLayout({ children }: { children: ReactNode }) {
  const { config } = useConfig();
  
  return (
    <div className={styles.layout}>
      <Navbar appName={config?.appName} />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
