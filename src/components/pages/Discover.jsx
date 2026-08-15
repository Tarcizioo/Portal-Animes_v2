import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clapperboard,
  Flame,
  Heart,
  LayoutGrid,
  Mic2,
  Rocket,
  Search,
  Skull,
  Smile,
  Sparkles,
  Theater,
  Trophy,
  UsersRound,
  Wand2,
  Zap,
} from 'lucide-react';
import { DiscoverHero } from '@/components/discover/DiscoverHero';
import { DiscoverRail } from '@/components/discover/DiscoverRail';
import { ProgressiveSection } from '@/components/discover/ProgressiveSection';
import { TodayReleases } from '@/components/discover/TodayReleases';
import { useDiscoverContent } from '@/hooks/useDiscoverContent';
import { usePageTitle } from '@/hooks/usePageTitle';

const GENRE_ICONS = {
  action: Zap,
  romance: Heart,
  drama: Theater,
  horror: Skull,
  comedy: Smile,
  fantasy: Wand2,
  scifi: Rocket,
  sports: Trophy,
};

function buildCatalogUrl(filters) {
  const params = new URLSearchParams(filters);
  return `/catalog?${params.toString()}`;
}

function DiscoverShortcut({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      aria-label={`${label}: ${description}`}
      className="group flex min-h-11 min-w-0 items-center justify-center gap-0.5 rounded-full border border-border-color bg-bg-secondary/60 px-0.5 text-[9px] font-semibold tracking-[-0.025em] text-text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-[360px]:text-[10px] min-[430px]:px-1 sm:min-h-16 sm:gap-3 sm:rounded-2xl sm:px-4 sm:text-sm sm:font-black sm:tracking-normal"
    >
      <Icon className="hidden h-3.5 w-3.5 shrink-0 text-text-secondary transition-colors group-hover:text-primary min-[360px]:block sm:h-5 sm:w-5" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

const BEYOND_ANIME = [
  {
    title: 'Personagens',
    description: 'Ícones e protagonistas do catálogo',
    to: '/characters',
    icon: UsersRound,
  },
  {
    title: 'Pessoas',
    description: 'Vozes e profissionais da indústria',
    to: '/people',
    icon: Mic2,
  },
  {
    title: 'Estúdios',
    description: 'Encontre os estúdios por trás das obras',
    to: '/search?type=studio',
    icon: Building2,
  },
];

export function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    season,
    year,
    seasonHighlight,
    newSeasonalAnimes,
    todayReleases,
    genreRows,
    discoveryLoading,
    discoveryError,
    retryDiscovery,
    releasesLoading,
    releasesError,
    retryReleases,
  } = useDiscoverContent();

  usePageTitle('Descobrir');

  const seasonUrl = buildCatalogUrl({ season, year: String(year), orderBy: 'newest' });
  const shortcuts = [
    {
      label: 'Gêneros',
      description: 'abrir títulos de ação por popularidade',
      icon: LayoutGrid,
      to: buildCatalogUrl({ genre: '1', orderBy: 'popularity' }),
    },
    {
      label: 'Temporada',
      description: `filtrar a temporada atual de ${year}`,
      icon: CalendarDays,
      to: seasonUrl,
    },
    {
      label: 'Populares',
      description: 'ordenar o catálogo por popularidade',
      icon: Flame,
      to: buildCatalogUrl({ orderBy: 'popularity' }),
    },
    {
      label: 'Formatos',
      description: 'filtrar títulos no formato TV',
      icon: Clapperboard,
      to: buildCatalogUrl({ type: 'tv', orderBy: 'popularity' }),
    },
  ];

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}&type=all`);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pb-12">
      <header>
        <p className="hidden text-[10px] font-black uppercase tracking-[0.2em] text-primary sm:block">Explore o catálogo</p>
        <h1 className="text-3xl font-black tracking-tight text-text-primary sm:mt-1 sm:text-4xl">Descobrir</h1>

        <form onSubmit={handleSearch} className="mt-3 sm:mt-5" role="search">
          <label htmlFor="discover-search" className="sr-only">Buscar no universo dos animes</label>
          <div className="relative rounded-2xl border border-border-color bg-bg-secondary/70 shadow-lg shadow-black/5 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 sm:rounded-3xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary sm:left-5 sm:h-6 sm:w-6" aria-hidden="true" />
            <input
              id="discover-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar no universo dos animes"
              className="h-14 w-full rounded-[inherit] bg-transparent pl-12 pr-20 text-sm font-semibold text-text-primary outline-none placeholder:font-normal placeholder:text-text-secondary/70 sm:h-16 sm:pl-14 sm:text-base"
            />
            <button type="submit" disabled={!searchQuery.trim()} className="absolute right-2 top-1/2 inline-flex min-h-10 -translate-y-1/2 items-center rounded-xl bg-primary px-3 text-xs font-black text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-0 sm:right-3 sm:px-4">
              Buscar
            </button>
          </div>
        </form>
      </header>

      <main className="mt-4 space-y-6 sm:mt-8 sm:space-y-10">
        <section aria-labelledby="discover-shortcuts-title">
          <h2 id="discover-shortcuts-title" className="mb-2 text-base font-black tracking-tight text-text-primary sm:mb-3 sm:text-xl">Explorar</h2>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            {shortcuts.map((shortcut) => <DiscoverShortcut key={shortcut.label} {...shortcut} />)}
          </div>
        </section>

        <DiscoverHero
          anime={seasonHighlight}
          loading={discoveryLoading && !seasonHighlight}
          error={discoveryError}
          onRetry={retryDiscovery}
        />

        <DiscoverRail
          sectionId="new-season"
          title="Novos nesta temporada"
          icon={Sparkles}
          animes={newSeasonalAnimes}
          actionTo={seasonUrl}
          loading={discoveryLoading && newSeasonalAnimes.length === 0}
          error={discoveryError}
          onRetry={retryDiscovery}
        />

        <TodayReleases
          releases={todayReleases}
          loading={releasesLoading}
          error={releasesError}
          onRetry={retryReleases}
        />

        <div className="space-y-7 sm:space-y-11" aria-label="Seleções por gênero">
          {genreRows.map((row) => {
            const Icon = GENRE_ICONS[row.id];
            return (
              <ProgressiveSection key={row.id}>
                <DiscoverRail
                  sectionId={`genre-${row.id}`}
                  title={row.title}
                  icon={Icon}
                  animes={row.animes}
                  actionTo={buildCatalogUrl({ genre: String(row.genreId), orderBy: 'popularity' })}
                  loading={discoveryLoading && row.animes.length === 0}
                  error={discoveryError}
                  onRetry={retryDiscovery}
                />
              </ProgressiveSection>
            );
          })}
        </div>

        <ProgressiveSection minHeight={220}>
          <section aria-labelledby="beyond-anime-title">
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Universo do catálogo</p>
              <h2 id="beyond-anime-title" className="mt-1 text-xl font-black tracking-tight text-text-primary sm:text-2xl">Além dos animes</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {BEYOND_ANIME.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} to={item.to} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-border-color bg-bg-secondary/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/45 hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-32 sm:flex-col sm:items-start sm:justify-between">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1 sm:flex-none">
                      <span className="block font-black text-text-primary">{item.title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-text-secondary">{item.description}</span>
                    </span>
                    <ArrowRightIcon />
                  </Link>
                );
              })}
            </div>
          </section>
        </ProgressiveSection>
      </main>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-color text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true">
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}
