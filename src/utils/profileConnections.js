const PLATFORM_HOSTS = {
  twitter: ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  discord: ['discord.com', 'www.discord.com', 'discordapp.com', 'www.discordapp.com'],
};

export const CONNECTION_PLATFORMS = [
  {
    id: 'discord',
    label: 'Discord',
    hint: 'Nome de usuario',
    placeholder: 'seu.usuario',
    accent: '#5865F2',
    surface: 'bg-[#5865F2]/10 border-[#5865F2]/25 hover:border-[#5865F2]/55',
  },
  {
    id: 'twitter',
    label: 'X',
    hint: 'Perfil no X',
    placeholder: '@usuario ou x.com/usuario',
    accent: '#f5f5f5',
    surface: 'bg-white/5 border-white/10 hover:border-white/30',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    hint: 'Perfil no Instagram',
    placeholder: '@usuario ou instagram.com/usuario',
    accent: '#f472b6',
    surface: 'bg-pink-500/10 border-pink-500/20 hover:border-pink-400/50',
  },
];

function extractPathHandle(value, platform) {
  const trimmed = value.trim();
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  const candidate = isHttpUrl ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!PLATFORM_HOSTS[platform]?.includes(url.hostname.toLowerCase())) {
      return isHttpUrl ? '' : trimmed;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    return segments.at(-1) || '';
  } catch {
    return trimmed;
  }
}

export function normalizeConnectionValue(platform, value = '') {
  const extracted = extractPathHandle(String(value), platform);
  let decoded = extracted;

  try {
    decoded = decodeURIComponent(extracted);
  } catch {
    // Keep malformed user input editable instead of crashing the profile modal.
  }

  return decoded
    .trim()
    .replace(/^@+/, '')
    .replace(/[/?#].*$/, '')
    .replace(/\s+/g, '')
    .slice(0, 80);
}

export function getConnectionHref(platform, value) {
  const handle = normalizeConnectionValue(platform, value);
  if (!handle) return null;

  if (platform === 'twitter') return `https://x.com/${encodeURIComponent(handle)}`;
  if (platform === 'instagram') return `https://instagram.com/${encodeURIComponent(handle)}`;
  return null;
}

export function formatConnectionHandle(platform, value) {
  const handle = normalizeConnectionValue(platform, value);
  if (!handle) return '';
  return platform === 'discord' ? handle : `@${handle}`;
}
