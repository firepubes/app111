const FIRST = [
  // Adjectives / Traits
  'swift', 'calm', 'brave', 'wild', 'happy', 'cool', 'smart', 'quiet', 'bold', 'dark',
  'bright', 'lucky', 'proud', 'noble', 'kind', 'sharp', 'pure', 'fresh', 'grand', 'royal',
  'silent', 'hidden', 'clever', 'gentle', 'fierce', 'eager', 'jolly', 'merry', 'sunny', 'chill',
  'super', 'hyper', 'mega', 'ultra', 'epic', 'magic', 'mystic', 'cosmic', 'stellar', 'solar',
  'rapid', 'lazy', 'vivid', 'breezy', 'crazy', 'sneaky', 'flashy', 'fuzzy', 'bouncy', 'crisp',
  'frosty', 'glossy', 'hasty', 'mighty', 'nimble', 'quirky', 'rusty', 'shiny', 'tidy', 'witty',
  // Colors
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'white', 'black', 'silver', 'gold',
  'crimson', 'cyan', 'azure', 'teal', 'indigo', 'violet', 'maroon', 'amber', 'coral', 'jade',
  'pink', 'brown', 'grey', 'ruby', 'pearl', 'onyx', 'ivory', 'bronze', 'copper', 'peach'
];

const SECOND = [
  // Animals
  'fox', 'bear', 'wolf', 'lion', 'tiger', 'hawk', 'owl', 'eagle', 'deer', 'frog',
  'duck', 'swan', 'dove', 'crow', 'raven', 'shark', 'whale', 'seal', 'puma', 'lynx',
  'cat', 'dog', 'bird', 'fish', 'bug', 'ant', 'bee', 'wasp', 'moth', 'crab',
  'snake', 'toad', 'mouse', 'rat', 'bat', 'sloth', 'koala', 'panda', 'rhino', 'hippo',
  // Nature & Cosmos
  'tree', 'leaf', 'wood', 'rock', 'stone', 'sand', 'dust', 'star', 'moon', 'sun',
  'cloud', 'rain', 'snow', 'wind', 'storm', 'fire', 'ice', 'wave', 'sea', 'lake',
  'river', 'hill', 'mountain', 'valley', 'forest', 'cave', 'island', 'sky', 'space', 'galaxy',
  // Objects & Food & Tech
  'byte', 'pixel', 'code', 'data', 'chip', 'wire', 'grid', 'node', 'link', 'web',
  'apple', 'berry', 'cherry', 'grape', 'lemon', 'melon', 'peach', 'plum', 'mint', 'bean'
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomLocalPart(): string {
  const useNumber = Math.random() < 0.8;
  const suffix = useNumber ? String(Math.floor(Math.random() * 90) + 10) : '';
  return `${pick(FIRST)}${pick(SECOND)}${suffix}`;
}

export async function generateUniqueAddress(
  exists: (addr: string) => Promise<boolean>,
  domain: string
): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const address = `${randomLocalPart()}@${domain}`;
    if (!(await exists(address))) {
      return address;
    }
  }

  const fallback = `${randomLocalPart()}${Date.now().toString().slice(-4)}@${domain}`;
  if (!(await exists(fallback))) {
    return fallback;
  }

  throw new Error('Failed to generate unique inbox address');
}
