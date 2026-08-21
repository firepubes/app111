import { useState } from 'react';
import { Sparkles, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import styles from './CreateInbox.module.css';

interface CreateInboxProps {
  domains: string[];
  onCreateCustom: (localPart: string, domain: string) => Promise<void>;
  onCreateRandom: (domain: string) => Promise<void>;
}

export function CreateInbox({ domains, onCreateCustom, onCreateRandom }: CreateInboxProps) {
  const [localPart, setLocalPart] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(domains[0] ?? '');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateCustom(localPart.trim(), selectedDomain);
      setLocalPart('');
      toast.success('Inbox created');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create inbox');
    } finally {
      setCreating(false);
    }
  };

  const handleRandom = async () => {
    setCreating(true);
    try {
      await onCreateRandom(selectedDomain);
      toast.success('Random inbox created');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create inbox');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.box}>
      <div className={styles.inputRow}>
        <input
          id="localPartInput"
          className={styles.input}
          type="text"
          value={localPart}
          onChange={(e) => setLocalPart(e.target.value)}
          placeholder="username or leave empty for random"
          aria-label="Email username"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleCreate();
          }}
        />

        {domains.length > 1 && (
          <select
            id="domainSelect"
            className={styles.domainSelect}
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            aria-label="Select domain"
          >
            {domains.map((d) => (
              <option key={d} value={d}>@{d}</option>
            ))}
          </select>
        )}
      </div>

      <div className={styles.buttonRow}>
        <Button
          variant="accent"
          icon={<Sparkles />}
          onClick={handleCreate}
          loading={creating}
          disabled={!localPart.trim()}
        >
          Create
        </Button>

        <Button
          variant="primary"
          icon={<Shuffle />}
          onClick={handleRandom}
          loading={creating}
        >
          Random
        </Button>
      </div>
    </div>
  );
}
