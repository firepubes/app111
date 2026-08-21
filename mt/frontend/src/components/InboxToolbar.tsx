import { Copy, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import type { Inbox } from '../types';
import styles from './InboxToolbar.module.css';

interface InboxToolbarProps {
  inboxes: Inbox[];
  selectedAddress: string;
  onSelectAddress: (address: string) => void;
  onNew: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  showCreateBox: boolean;
}

export function InboxToolbar({
  inboxes,
  selectedAddress,
  onSelectAddress,
  onNew,
  onDelete,
  onRefresh,
  showCreateBox,
}: InboxToolbarProps) {
  const handleCopy = async () => {
    if (!selectedAddress) return;
    try {
      await navigator.clipboard.writeText(selectedAddress);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.selectWrap}>
        <select
          id="inboxSelect"
          className={styles.select}
          value={selectedAddress}
          onChange={(e) => onSelectAddress(e.target.value)}
          aria-label="Select inbox"
        >
          {inboxes.length === 0 ? (
            <option value="">No inboxes yet</option>
          ) : (
            inboxes.map((inbox) => (
              <option key={inbox.address} value={inbox.address}>
                {inbox.address}
              </option>
            ))
          )}
        </select>
      </div>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          icon={<Copy />}
          onClick={handleCopy}
          disabled={!selectedAddress}
          aria-label="Copy email address"
        >
          Copy
        </Button>

        <Button
          variant="secondary"
          icon={<RefreshCw />}
          onClick={onRefresh}
          aria-label="Refresh messages"
        >
          Refresh
        </Button>

        <Button
          variant={showCreateBox ? 'accent' : 'primary'}
          icon={<Plus />}
          onClick={onNew}
          aria-label={showCreateBox ? 'Close create inbox' : 'Create new inbox'}
        >
          New
        </Button>

        <Button
          variant="danger"
          icon={<Trash2 />}
          onClick={onDelete}
          disabled={!selectedAddress}
          aria-label="Delete inbox"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
