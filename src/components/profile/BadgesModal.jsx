import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Check, Lock, Plus, Save, Sparkles, Trophy, X } from 'lucide-react';
import { BADGES, getBadgeProgress } from '@/constants/badges';
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/context/ToastContext';

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'unlocked', label: 'Desbloqueadas' },
  { id: 'locked', label: 'Em progresso' },
];

export function BadgesModal({ isOpen, onClose }) {
  const { stats, unlockedBadges } = useAchievements();
  const { profile, updateProfileData } = useUserProfile();
  const { toast } = useToast();
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  useAccessibleDialog({ isOpen, onClose, dialogRef, initialFocusRef: closeButtonRef });
  const unlockedIds = useMemo(() => new Set(unlockedBadges.map((badge) => badge.id)), [unlockedBadges]);

  useEffect(() => {
    if (!isOpen) return;
    const saved = Array.isArray(profile?.featuredBadges)
      ? profile.featuredBadges.filter((id) => unlockedIds.has(id))
      : unlockedBadges.slice(0, 3).map((badge) => badge.id);
    setSelectedBadges(saved.slice(0, 3));
    setFilter('all');
  }, [isOpen, profile?.featuredBadges, unlockedBadges, unlockedIds]);

  const visibleBadges = BADGES.filter((badge) => {
    if (filter === 'unlocked') return unlockedIds.has(badge.id);
    if (filter === 'locked') return !unlockedIds.has(badge.id);
    return true;
  });

  const toggleBadge = (badgeId) => {
    if (!unlockedIds.has(badgeId)) return;
    setSelectedBadges((current) => {
      if (current.includes(badgeId)) return current.filter((id) => id !== badgeId);
      if (current.length >= 3) {
        toast.warning('Remova uma conquista da vitrine antes de adicionar outra.', 'Vitrine completa');
        return current;
      }
      return [...current, badgeId];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileData({ featuredBadges: selectedBadges });
      onClose();
    } catch {
      toast.error('Não foi possível atualizar sua vitrine.', 'Conquistas');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/85 p-0 backdrop-blur-md sm:items-center sm:p-4" onMouseDown={onClose}>
      <div ref={dialogRef} tabIndex={-1} className="flex h-[94dvh] w-full min-w-0 max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-border-color bg-bg-secondary shadow-2xl sm:h-[92vh] sm:max-h-[820px] sm:rounded-3xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="badges-modal-title">
        <header className="shrink-0 border-b border-border-color bg-[radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.20),transparent_38%),linear-gradient(120deg,rgba(99,102,241,0.12),transparent)] px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20"><Trophy className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Sua jornada</p>
                <h2 id="badges-modal-title" className="truncate text-xl font-black text-text-primary sm:text-2xl">Vitrine de conquistas</h2>
                <p className="mt-1 text-xs text-text-secondary">Escolha até três marcos para mostrar no perfil.</p>
              </div>
            </div>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fechar conquistas" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-bg-primary/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"><X className="h-5 w-5" aria-hidden="true" /></button>
          </div>
        </header>

        <section className="min-w-0 shrink-0 overflow-hidden border-b border-border-color bg-bg-primary/20 px-5 py-4 sm:px-7" aria-labelledby="featured-badges-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p id="featured-badges-title" className="text-xs font-black uppercase tracking-[0.16em] text-text-primary">Seus destaques</p>
              <p className="mt-0.5 text-[10px] text-text-secondary">A ordem abaixo é a ordem exibida no perfil.</p>
            </div>
            <span className="shrink-0 rounded-full border border-button-accent/25 bg-button-accent/10 px-3 py-1 text-[10px] font-black text-button-accent">{selectedBadges.length}/3 escolhidas</span>
          </div>

          <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
            {[0, 1, 2].map((slot) => {
              const badge = BADGES.find((item) => item.id === selectedBadges[slot]);
              const Icon = badge?.icon;
              return badge ? (
                <button key={slot} type="button" onClick={() => toggleBadge(badge.id)} aria-label={`Remover ${badge.name} do destaque ${slot + 1}`} className={clsx('group flex min-h-16 w-full min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-2xl border-2 p-2.5 text-left transition-colors', badge.bg, badge.border, 'hover:border-red-400/60')}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-button-accent text-xs font-black text-text-on-primary">{slot + 1}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/15"><Icon className={clsx('h-4 w-4', badge.color)} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={clsx('block text-[9px] font-black uppercase tracking-wider', badge.color)}>{badge.rarity}</span>
                    <span className="block truncate text-xs font-black text-text-primary" title={badge.name}>{badge.name}</span>
                  </span>
                  <X className="h-4 w-4 shrink-0 text-text-secondary transition-colors group-hover:text-red-400" />
                </button>
              ) : (
                <div key={slot} className="flex min-h-16 w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-border-color bg-bg-primary/30 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-color text-xs font-black text-text-secondary">{slot + 1}</span>
                  <Plus className="h-4 w-4 shrink-0 text-text-secondary" />
                  <span><span className="block text-xs font-black text-text-primary">Espaço livre</span><span className="block text-[10px] text-text-secondary">Selecione uma conquista</span></span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border-color px-5 py-3 sm:px-7" aria-label="Filtros de conquistas">
          {FILTERS.map((item) => {
            const count = item.id === 'all' ? BADGES.length : item.id === 'unlocked' ? unlockedBadges.length : BADGES.length - unlockedBadges.length;
            return (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className={clsx('min-h-11 shrink-0 rounded-xl px-3 text-xs font-black transition-colors', filter === item.id ? 'bg-button-accent text-text-on-primary shadow-md shadow-button-accent/15' : 'bg-bg-tertiary text-text-secondary hover:text-text-primary')}>
                {item.label} <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-stretch gap-3 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
            {visibleBadges.map((badge) => {
              const unlocked = unlockedIds.has(badge.id);
              const selectedIndex = selectedBadges.indexOf(badge.id);
              const selected = selectedIndex >= 0;
              const progress = getBadgeProgress(badge, stats);
              const Icon = badge.icon;

              return (
                <button
                  key={badge.id}
                  type="button"
                  disabled={!unlocked}
                  aria-pressed={unlocked ? selected : undefined}
                  onClick={() => toggleBadge(badge.id)}
                  className={clsx(
                    'flex h-full min-h-52 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border p-4 text-left transition-all',
                    selected && 'border-button-accent bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(99,102,241,0.06))] ring-2 ring-button-accent/25',
                    unlocked && !selected && 'border-border-color bg-bg-tertiary/25 hover:-translate-y-0.5 hover:border-button-accent/45',
                    !unlocked && 'cursor-default border-border-color/60 bg-bg-primary/25 opacity-70',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', unlocked ? badge.bg : 'bg-bg-tertiary')}>
                      {unlocked ? <Icon className={clsx('h-5 w-5', badge.color)} /> : <Lock className="h-4 w-4 text-text-secondary" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-text-primary">{badge.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{badge.category} · {badge.rarity}</p>
                    </div>
                    {selected ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-button-accent px-2 py-1 text-[9px] font-black uppercase text-text-on-primary"><Check className="h-3 w-3" /> Destaque {selectedIndex + 1}</span>
                    ) : unlocked ? (
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase text-emerald-400">Disponível</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-bg-tertiary px-2 py-1 text-[9px] font-black uppercase text-text-secondary">Bloqueada</span>
                    )}
                  </div>

                  <p className="mt-3 flex-1 text-xs leading-relaxed text-text-secondary">{badge.description}</p>

                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between gap-3 text-[10px] font-bold text-text-secondary"><span>{unlocked ? 'Concluída' : badge.unit}</span><span>{progress.value}/{progress.target}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-primary"><div className={clsx('h-full rounded-full transition-[width] duration-500', unlocked ? 'bg-emerald-400' : 'bg-button-accent')} style={{ width: `${progress.percentage}%` }} /></div>
                  </div>

                  <div className={clsx('mt-4 flex items-center gap-2 border-t pt-3 text-[10px] font-black uppercase tracking-wider', selected ? 'border-button-accent/20 text-button-accent' : unlocked ? 'border-border-color text-emerald-400' : 'border-border-color text-text-secondary')}>
                    {selected ? <Check className="h-3.5 w-3.5" /> : unlocked ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {selected ? 'Selecionada · clique para remover' : unlocked ? 'Adicionar à vitrine' : 'Continue avançando para desbloquear'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-border-color bg-bg-tertiary/35 px-5 pt-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom,0px))] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pb-4">
          <p className="text-xs font-bold text-text-secondary"><span className="text-text-primary">{selectedBadges.length}/3</span> espaços usados</p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-border-color px-4 text-sm font-bold text-text-secondary transition-colors hover:text-text-primary">Cancelar</button>
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-button-accent px-5 text-sm font-black text-text-on-primary shadow-md shadow-button-accent/15 disabled:opacity-60"><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'Salvando...' : 'Salvar vitrine'}</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
