import { useState } from 'react';
import { CalendarDays, Edit3, Heart, Maximize2, Share2 } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { ImageModal } from '@/components/ui/ImageModal';
import { ProfileConnections } from '@/components/profile/ProfileConnections';

function getMemberSince(createdAt) {
  const value = createdAt?.toDate?.() || createdAt;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function CountButton({ value, label, loading, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="group text-left disabled:cursor-default">
      <span className="block text-base font-black text-text-primary">{loading ? '—' : Number(value || 0).toLocaleString('pt-BR')}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary group-enabled:group-hover:text-button-accent">{label}</span>
    </button>
  );
}

export function ProfileHeader({
  user,
  profile,
  onEdit,
  onShare,
  readOnly = false,
  onCompatibility,
  compatibilityScore,
  followButton,
  followersCount,
  followingCount,
  countsLoading = false,
  onFollowersClick,
  onFollowingClick,
}) {
  const banner = profile?.bannerURL || null;
  const photo = profile?.photoURL || null;
  const name = profile?.displayName || user?.displayName || 'Usuário';
  const initials = name.trim().slice(0, 2).toLocaleUpperCase('pt-BR');
  const memberSince = getMemberSince(profile?.createdAt || user?.metadata?.creationTime);
  const genres = profile?.favoriteGenres || [];
  const [lightbox, setLightbox] = useState({ open: false, url: '', alt: '' });

  const openLightbox = (url, alt) => {
    if (url) setLightbox({ open: true, url, alt });
  };

  return (
    <>
      <article className="overflow-hidden rounded-3xl border border-border-color bg-bg-secondary shadow-2xl shadow-black/10">
        <div className="relative mx-3 mt-3 h-40 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_18%_25%,rgba(99,102,241,0.52),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(34,211,238,0.18),transparent_25%),linear-gradient(135deg,#18181b,#09090b)] sm:mx-4 sm:mt-4 sm:h-56 lg:h-64">
          {banner && (
            <button type="button" onClick={() => openLightbox(banner, `Banner de ${name}`)} className="group absolute inset-0 block h-full w-full overflow-hidden rounded-[inherit] border-0 bg-transparent p-0 leading-none" aria-label="Ampliar banner">
              <img src={banner} alt="" className="absolute inset-0 block h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" />
              <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100"><Maximize2 className="h-4 w-4" /></span>
            </button>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-secondary via-transparent to-black/20" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md sm:left-6 sm:top-6">
            <span className={`h-2 w-2 rounded-full ${profile?.isOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-zinc-400'}`} />
            {profile?.isOnline ? 'Online agora' : 'Perfil de membro'}
          </div>
        </div>

        <div className="relative px-5 pb-6 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
            <button type="button" onClick={() => openLightbox(photo, name)} disabled={!photo} className="group relative -mt-14 aspect-square h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-bg-secondary bg-bg-tertiary p-0 leading-none shadow-2xl disabled:cursor-default sm:-mt-16 sm:h-32 sm:w-32" aria-label={photo ? 'Ampliar foto de perfil' : undefined}>
              {photo ? <img src={photo} alt={name} className="absolute inset-0 block h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-button-accent/25 to-cyan-400/10 text-3xl font-black text-button-accent">{initials}</span>}
            </button>

            <div className="min-w-0 flex-1 pb-0 sm:pb-1">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <CountButton value={followersCount ?? profile?.followersCount} label="Seguidores" loading={countsLoading} onClick={onFollowersClick} />
                    <span className="h-7 w-px bg-border-color" />
                    <CountButton value={followingCount ?? profile?.followingCount} label="Seguindo" loading={countsLoading} onClick={onFollowingClick} />
                    {memberSince && <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary"><CalendarDays className="h-3.5 w-3.5" /> Desde {memberSince}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!readOnly && (
                    <>
                      <Motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onShare} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border-color bg-bg-tertiary/50 px-3.5 text-xs font-black text-text-secondary transition-colors hover:border-button-accent/40 hover:text-text-primary"><Share2 className="h-4 w-4" /> Compartilhar</Motion.button>
                      <Motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => onEdit?.('appearance')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-button-accent px-4 text-xs font-black text-text-on-primary shadow-lg shadow-button-accent/20"><Edit3 className="h-4 w-4" /> Editar perfil</Motion.button>
                    </>
                  )}
                  {readOnly && onCompatibility && compatibilityScore !== null && (
                    <Motion.button whileTap={{ scale: 0.97 }} type="button" onClick={onCompatibility} className="inline-flex h-10 items-center gap-2 rounded-xl border border-pink-500/30 bg-pink-500/10 px-3.5 text-xs font-black text-pink-300"><Heart className="h-4 w-4 fill-pink-400" /> {compatibilityScore}% compatível</Motion.button>
                  )}
                  {readOnly && followButton}
                </div>
              </div>
            </div>
          </div>

          {(profile?.about || genres.length > 0 || profile?.connections || !readOnly) && (
            <div className="mt-6 grid gap-5 border-t border-border-color pt-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {profile?.about || (!readOnly ? 'Adicione uma bio para contar um pouco sobre você e seus animes favoritos.' : '')}
                </p>
                {genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {genres.slice(0, 6).map((genre) => <span key={genre} className="rounded-full border border-border-color bg-bg-tertiary/40 px-2.5 py-1 text-[10px] font-bold text-text-secondary">{genre}</span>)}
                    {genres.length > 6 && <span className="rounded-full bg-button-accent/10 px-2.5 py-1 text-[10px] font-black text-button-accent">+{genres.length - 6}</span>}
                  </div>
                )}
              </div>
              <ProfileConnections connections={profile?.connections} onAdd={!readOnly ? () => onEdit?.('connections') : undefined} className="lg:justify-end" />
            </div>
          )}
        </div>
      </article>

      <ImageModal isOpen={lightbox.open} onClose={() => setLightbox({ open: false, url: '', alt: '' })} imageUrl={lightbox.url} altText={lightbox.alt} />
    </>
  );
}
