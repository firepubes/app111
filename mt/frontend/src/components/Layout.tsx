import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  appName: string;
  mailDomain: string;
  children: ReactNode;
}

export function Layout({ appName, mailDomain, children }: LayoutProps) {
  return (
    <div className="app-layout">
      <Header appName={appName} mailDomain={mailDomain} />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
}
