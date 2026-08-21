import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useConfig } from '../hooks/useConfig';
import styles from './Home.module.css';

export default function Home() {
  const { config } = useConfig();

  const expiryText =
    config?.expiryDays !== undefined
      ? config.expiryDays === 0
        ? 'No automatic expiry'
        : `${config.expiryDays} day${config.expiryDays === 1 ? '' : 's'}`
      : 'Automatic cleanup';

  return (
    <div className={styles.page}>
      <div className={styles.backgroundGlow} />
      <div className={styles.grid} />

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              A Ratiodevelopment service
            </div>

            <h1 className={styles.heroTitle}>
              Temporary email.
              <br />
              <span>Built differently.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Create disposable inboxes instantly and keep your real email
              address out of the hands of spam, trackers and unwanted
              marketing.
            </p>

            <div className={styles.heroActions}>
              <Link to="/mail" className={styles.primaryButton}>
                Create an inbox
                <ArrowRight size={18} />
              </Link>

              <Link to="/how-to-support" className={styles.secondaryButton}>
                How it works
              </Link>
            </div>

            <div className={styles.trustRow}>
              <div>
                <CheckCircle2 size={16} />
                No registration
              </div>

              <div>
                <ShieldCheck size={16} />
                Privacy focused
              </div>

              <div>
                <Zap size={16} />
                Instant delivery
              </div>
            </div>
          </div>

          {/* Product Preview */}
          <div className={styles.previewWrapper}>
            <div className={styles.previewGlow} />

            <div className={styles.preview}>
              <div className={styles.previewTop}>
                <div className={styles.previewBrand}>
                  <div className={styles.brandIcon}>
                    <Mail size={17} />
                  </div>

                  <div>
                    <strong>MailTune</strong>
                    <span>Temporary Inbox</span>
                  </div>
                </div>

                <div className={styles.online}>
                  <span />
                  Online
                </div>
              </div>

              <div className={styles.addressBox}>
                <span className={styles.addressLabel}>YOUR ADDRESS</span>

                <strong>
                  {config?.mailDomain
                    ? `hello@${config.mailDomain}`
                    : 'hello@temp.ratiodevelopment.xyz'}
                </strong>

                <div className={styles.addressStatus}>
                  <span />
                  Receiving mail
                </div>
              </div>

              <div className={styles.previewMessages}>
                <div className={styles.message}>
                  <div className={styles.messageIcon}>
                    <Inbox size={17} />
                  </div>

                  <div className={styles.messageContent}>
                    <strong>Welcome to your inbox</strong>
                    <span>MailTune</span>
                  </div>

                  <time>now</time>
                </div>

                <div className={styles.message}>
                  <div className={styles.messageIcon}>
                    <Sparkles size={17} />
                  </div>

                  <div className={styles.messageContent}>
                    <strong>Your verification code</strong>
                    <span>Example Service</span>
                  </div>

                  <time>2m</time>
                </div>

                <div className={styles.message}>
                  <div className={styles.messageIcon}>
                    <Mail size={17} />
                  </div>

                  <div className={styles.messageContent}>
                    <strong>Confirm your account</strong>
                    <span>Account Services</span>
                  </div>

                  <time>8m</time>
                </div>
              </div>

              <div className={styles.previewFooter}>
                <div>
                  <Clock3 size={15} />
                  {expiryText}
                </div>

                <span>MailTune</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.stats}>
          <div>
            <span>01</span>
            <strong>Create</strong>
            <p>Generate a temporary email address in seconds.</p>
          </div>

          <div>
            <span>02</span>
            <strong>Receive</strong>
            <p>Messages appear automatically in your inbox.</p>
          </div>

          <div>
            <span>03</span>
            <strong>Disappear</strong>
            <p>Old messages are automatically cleaned up.</p>
          </div>
        </section>

        {/* Features */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>WHY MAILTUNE</span>
              <h2>Email without the baggage.</h2>
            </div>

            <p>
              Designed for situations where you need an inbox, but don't need
              another permanent email address.
            </p>
          </div>

          <div className={styles.features}>
            <article className={styles.feature}>
              <div className={styles.featureIcon}>
                <LockKeyhole size={21} />
              </div>

              <h3>Private by default</h3>

              <p>
                Keep your personal mailbox away from services that don't need
                to know your real address.
              </p>
            </article>

            <article className={styles.feature}>
              <div className={styles.featureIcon}>
                <Zap size={21} />
              </div>

              <h3>Instant delivery</h3>

              <p>
                Incoming messages are processed and displayed as soon as they
                reach MailTune.
              </p>
            </article>

            <article className={styles.feature}>
              <div className={styles.featureIcon}>
                <Clock3 size={21} />
              </div>

              <h3>Automatic cleanup</h3>

              <p>
                Temporary inboxes are designed to disappear rather than become
                another mailbox you have to manage.
              </p>
            </article>

            <article className={styles.feature}>
              <div className={styles.featureIcon}>
                <ShieldCheck size={21} />
              </div>

              <h3>Receive only</h3>

              <p>
                MailTune is intentionally designed for receiving messages, not
                sending spam or unwanted mail.
              </p>
            </article>
          </div>
        </section>

        {/* Warning */}
        <section className={styles.warning}>
          <ShieldCheck size={22} />

          <div>
            <strong>Temporary means temporary.</strong>
            <p>
              Never use MailTune for banking, password recovery, important
              accounts or anything you cannot afford to lose access to.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div>
            <span>READY WHEN YOU ARE</span>
            <h2>Your next inbox is one click away.</h2>
          </div>

          <Link to="/mail" className={styles.ctaButton}>
            Open MailTune
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <div className={styles.footerBrand}>
            <div className={styles.brandIcon}>
              <Mail size={15} />
            </div>

            <strong>MailTune</strong>
          </div>

          <span>Powered by Ratiodevelopment</span>
        </div>

        <span>© {new Date().getFullYear()} Ratiodevelopment</span>
      </footer>
    </div>
  );
}