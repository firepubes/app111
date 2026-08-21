import { Heart, MessageCircle, Music, Bug, Lightbulb, Users } from 'lucide-react';
import { EXTERNAL_LINKS } from '../links';
import styles from './Support.module.css';

export default function Support() {
  return (
    <div className={styles.supportContainer}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <span className={styles.badgeDot}></span>
          support & community
        </div>
        <h1 className={styles.title}>we're here for you</h1>
        <p className={styles.subtitle}>
          Whether you want to report a bug, suggest an idea, or join the community, you're in the right place.
        </p>
      </header>

      <section className={styles.topGrid}>
        {/* Support the project */}
        <div className={`${styles.card} ${styles.cardPink}`}>
          <div className={styles.iconWrapper}>
            <Heart size={24} />
          </div>
          <h2 className={styles.cardTitle}>support the project</h2>
          <p className={styles.cardText}>
            Want to help MailTune keep running? Ko-fi support is optional and only helps with hosting, maintenance, and development time.
          </p>
          <a href={EXTERNAL_LINKS.kofi} target="_blank" rel="noopener noreferrer" className={`btn ${styles.cardButton} ${styles.btnPink}`}>
            Support on Ko-fi
          </a>
        </div>

        {/* Need help */}
        <div className={`${styles.card} ${styles.cardYellow}`}>
          <div className={styles.iconWrapper}>
            <MessageCircle size={24} />
          </div>
          <h2 className={styles.cardTitle}>need help?</h2>
          <p className={styles.cardText}>
            Having trouble using tempmail, using API keys, or managing your emails? Join the community and ask for help.
          </p>
          <a href={EXTERNAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className={`btn ${styles.cardButton} ${styles.btnYellow}`}>
            Join Support Server
          </a>
        </div>

        {/* Invite Bot */}
        <div className={`${styles.card} ${styles.cardMint}`}>
          <div className={styles.iconWrapper}>
            <Music size={24} />
          </div>
          <h2 className={styles.cardTitle}>invite Listune Bot</h2>
          <p className={styles.cardText}>
            Bring high-quality music to your Discord server with Listune Bot, our custom Discord music bot.
          </p>
          <a href={EXTERNAL_LINKS.inviteBot} target="_blank" rel="noopener noreferrer" className={`btn ${styles.cardButton} ${styles.btnMint}`}>
            Invite Bot
          </a>
        </div>
      </section>

      <section className={styles.bottomList}>
        {/* Report a bug */}
        <div className={`${styles.horizontalCard}`}>
          <div className={`${styles.iconWrapperLarge} ${styles.bgPink}`}>
            <Bug size={24} />
          </div>
          <div className={styles.horizontalCardContent}>
            <h2 className={styles.cardTitle}>report a bug</h2>
            <p className={styles.cardText}>
              Found something broken? Report the issue with what happened, what you expected, and steps to reproduce.
              <br/>
              <small className={styles.mutedText}>Please include: what happened • what you expected • steps to reproduce</small>
            </p>
          </div>
          <a href={EXTERNAL_LINKS.reportIssue} target="_blank" rel="noopener noreferrer" className={`btn ${styles.cardButtonDark}`}>
            Report Issue
          </a>
        </div>

        {/* Suggest a feature */}
        <div className={`${styles.horizontalCard}`}>
          <div className={`${styles.iconWrapperLarge} ${styles.bgYellow}`}>
            <Lightbulb size={24} />
          </div>
          <div className={styles.horizontalCardContent}>
            <h2 className={styles.cardTitle}>suggest a feature</h2>
            <p className={styles.cardText}>
              Have an idea to make MailTune better? Share your suggestion and help shape the project.
            </p>
          </div>
          <a href={EXTERNAL_LINKS.suggestFeature} target="_blank" rel="noopener noreferrer" className={`btn ${styles.cardButtonDark}`}>
            Suggest Feature
          </a>
        </div>

        {/* Join the community */}
        <div className={`${styles.horizontalCard}`}>
          <div className={`${styles.iconWrapperLarge} ${styles.bgMint}`}>
            <Users size={24} />
          </div>
          <div className={styles.horizontalCardContent}>
            <h2 className={styles.cardTitle}>join the community</h2>
            <p className={styles.cardText}>
              Get updates, ask questions, share feedback, and connect with other Listune/MailTune users.
            </p>
          </div>
          <a href={EXTERNAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className={`btn ${styles.cardButtonDark}`}>
            Join Community
          </a>
        </div>
      </section>
    </div>
  );
}
