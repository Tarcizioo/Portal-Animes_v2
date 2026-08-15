import {
  Check,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  LockKeyhole,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react';

const isFilled = (value) => typeof value === 'string' && value.trim().length > 0;

function getProfileSetupState(profile, favoriteCount = 0) {
  const items = [
    {
      id: 'identity',
      title: 'Identidade',
      description: 'Nome e uma breve apresentação',
      complete: isFilled(profile?.displayName) && isFilled(profile?.about),
    },
    {
      id: 'appearance',
      title: 'Visual',
      description: 'Foto ou capa do perfil',
      complete: isFilled(profile?.photoURL) || isFilled(profile?.bannerURL),
    },
    {
      id: 'preferences',
      title: 'Seus gostos',
      description: 'Gêneros ou um anime favorito',
      complete: (Array.isArray(profile?.favoriteGenres) && profile.favoriteGenres.length > 0)
        || Number(favoriteCount) > 0,
    },
    {
      id: 'privacy',
      title: 'Privacidade',
      description: 'Defina quem pode encontrar seu perfil',
      complete: typeof profile?.isPublic === 'boolean',
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;

  return {
    items,
    completedCount,
    percentage: Math.round((completedCount / items.length) * 100),
  };
}

const ITEM_ICONS = {
  identity: UserRound,
  appearance: ImageIcon,
  preferences: Heart,
  privacy: LockKeyhole,
};

export function ProfileSetupCard({
  profile,
  favoriteCount = 0,
  onEditIdentity,
  onEditAppearance,
  onEditPreferences,
  onEditPrivacy,
  onOpenAccount,
}) {
  const { items, completedCount, percentage } = getProfileSetupState(profile, favoriteCount);
  const actions = {
    identity: onEditIdentity,
    appearance: onEditAppearance,
    preferences: onEditPreferences,
    privacy: onEditPrivacy,
  };

  if (percentage === 100) {
    return (
      <section
        aria-labelledby="profile-setup-complete-title"
        className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-bg-secondary"
      >
        <div className="h-1 bg-emerald-500" role="progressbar" aria-label="Conclusão do perfil" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400" aria-hidden="true">
            <Check className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="profile-setup-complete-title" className="font-black text-text-primary">Perfil completo</h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-400">100%</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">Sua vitrine está pronta para a comunidade.</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={onEditIdentity} className="min-h-11 rounded-xl border border-border-color px-3 py-2 text-xs font-black text-text-secondary transition-colors hover:border-button-accent/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
              Revisar perfil
            </button>
            <button type="button" onClick={onOpenAccount} className="min-h-11 rounded-xl bg-bg-tertiary px-3 py-2 text-xs font-black text-text-primary transition-colors hover:bg-button-accent/10 hover:text-button-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent">
              Conta
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="profile-setup-title" className="overflow-hidden rounded-2xl border border-border-color bg-bg-secondary">
      <div className="border-b border-border-color p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-button-accent/10 text-button-accent" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="profile-setup-title" className="font-black text-text-primary">Complete seu perfil</h3>
              <span className="rounded-full bg-button-accent/10 px-2.5 py-1 text-[10px] font-black text-button-accent">{percentage}% completo</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">Alguns detalhes ajudam a deixar seu espaço com a sua cara.</p>
          </div>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-bg-tertiary"
          role="progressbar"
          aria-label="Conclusão do perfil"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={percentage}
          aria-valuetext={`${completedCount} de ${items.length} etapas concluídas`}
        >
          <div className="h-full rounded-full bg-button-accent transition-[width] duration-500" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <ul className="space-y-1 p-2" aria-label="Etapas de configuração do perfil">
        {items.map((item) => {
          const Icon = ITEM_ICONS[item.id];

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={actions[item.id]}
                aria-label={`${item.complete ? 'Revisar' : 'Completar'} ${item.title}`}
                className="group flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.complete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-bg-tertiary text-text-secondary group-hover:text-button-accent'}`} aria-hidden="true">
                  {item.complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-black text-text-primary">{item.title}</span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-text-secondary">{item.description}</span>
                </span>
                <span className={`text-[10px] font-black ${item.complete ? 'text-emerald-400' : 'text-button-accent'}`}>
                  {item.complete ? 'Pronto' : 'Adicionar'}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border-color p-2">
        <button
          type="button"
          onClick={onOpenAccount}
          className="group flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-tertiary text-text-secondary group-hover:text-button-accent" aria-hidden="true">
            <Settings className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-black text-text-primary">Conta e segurança</span>
            <span className="mt-0.5 block text-[10px] text-text-secondary">E-mail, senha e dados da conta</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
