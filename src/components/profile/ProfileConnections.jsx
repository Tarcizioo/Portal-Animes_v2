import clsx from 'clsx';
import { Copy, ExternalLink, Link2, Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import {
  CONNECTION_PLATFORMS,
  formatConnectionHandle,
  getConnectionHref,
  normalizeConnectionValue,
} from '@/utils/profileConnections';

export function SocialIcon({ platform, className }) {
  if (platform === 'discord') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M20.3 4.4a19.8 19.8 0 0 0-4.9-1.5c-.2.4-.4.9-.6 1.3a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.6-1.3 19.7 19.7 0 0 0-4.9 1.5C.5 9-.3 13.6.1 18.1a19.9 19.9 0 0 0 5.9 3.1c.5-.6.9-1.3 1.2-2a13.1 13.1 0 0 1-1.9-.9l.4-.3c3.9 1.8 8.2 1.8 12.1 0l.4.3c-.6.3-1.2.6-1.9.9.4.7.8 1.4 1.2 2a19.8 19.8 0 0 0 6-3.1c.5-5.2-.8-9.7-3.2-13.7ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
      </svg>
    );
  }

  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2.2c3.2 0 3.6 0 4.9.1 3.2.1 4.7 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.2 3.2-1.7 4.7-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1C3.6 21.7 2.1 20.2 2 17c-.1-1.3-.1-1.6-.1-4.9s0-3.6.1-4.9c.2-3.2 1.7-4.7 4.9-4.9 1.3-.1 1.6-.1 4.9-.1Zm0 4A5.8 5.8 0 1 0 12 18a5.8 5.8 0 0 0 0-11.8Zm0 9.6a3.8 3.8 0 1 1 0-7.6 3.8 3.8 0 0 1 0 7.6Zm6-9.9a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.2 2.3h3.3l-7.2 8.2 8.5 11.2h-6.6L11 14.9 5 21.7H1.7l7.7-8.8L1.3 2.3h6.8l4.7 6.2 5.4-6.2Zm-1.1 17.5h1.8L7.1 4.1H5.2l11.9 15.7Z" />
    </svg>
  );
}

export function ProfileConnections({ connections, onAdd, className }) {
  const { toast } = useToast();
  const activeConnections = CONNECTION_PLATFORMS.filter((platform) =>
    normalizeConnectionValue(platform.id, connections?.[platform.id]),
  );

  const copyDiscord = async (value) => {
    const handle = formatConnectionHandle('discord', value);
    try {
      await navigator.clipboard.writeText(handle);
      toast.success(`${handle} copiado.`, 'Discord');
    } catch {
      toast.error('Não foi possível copiar o usuário.', 'Discord');
    }
  };

  if (activeConnections.length === 0 && !onAdd) return null;

  return (
    <div className={clsx('flex flex-wrap items-center gap-2', className)}>
      {activeConnections.map((platform) => {
        const value = connections[platform.id];
        const handle = formatConnectionHandle(platform.id, value);
        const href = getConnectionHref(platform.id, value);
        const commonClass = clsx(
          'group inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold text-text-primary transition-all hover:-translate-y-0.5',
          platform.surface,
        );
        const content = (
          <>
            <SocialIcon platform={platform.id} className="h-4 w-4" />
            <span className="max-w-28 truncate">{handle}</span>
            {href ? (
              <ExternalLink className="h-3.5 w-3.5 text-text-secondary transition-transform group-hover:translate-x-0.5" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-text-secondary" />
            )}
          </>
        );

        return href ? (
          <a key={platform.id} href={href} target="_blank" rel="noopener noreferrer" className={commonClass}>
            {content}
          </a>
        ) : (
          <button key={platform.id} type="button" onClick={() => copyDiscord(value)} className={commonClass}>
            {content}
          </button>
        );
      })}

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-border-color px-3 text-xs font-bold text-text-secondary transition-colors hover:border-button-accent/60 hover:text-button-accent"
        >
          {activeConnections.length > 0 ? <Plus className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {activeConnections.length > 0 ? 'Adicionar' : 'Conectar redes'}
        </button>
      )}
    </div>
  );
}
