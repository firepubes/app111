import styles from './LoadingState.module.css';

interface LoadingStateProps {
  lines?: number;
}

export function LoadingState({ lines = 3 }: LoadingStateProps) {
  return (
    <div className={styles.container} role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={styles.skeleton}
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
      <span className={styles.srOnly}>Loading…</span>
    </div>
  );
}
