import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDownUp,
  Building2,
  Calendar,
  ChevronDown,
  Clapperboard,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  Monitor,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFavoriteStudios } from '@/hooks/useFavoriteStudios';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { AnimeListItem } from '@/components/ui/AnimeListItem';
import { BackButton } from '@/components/ui/BackButton';
import { Loader } from '@/components/ui/Loader';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { anilistApi } from '@/services/anilistApi';

const ANILIST_STUDIO_PREFIX = 'anilist-studio-';
const VIEW_STORAGE_KEY = 'studio_details_view_mode';

const VIEW_OPTIONS = [
  { value: 'grid', label: '', ariaLabel: 'Visualização em grade', icon: LayoutGrid },
  { value: 'list', label: '', ariaLabel: 'Visualização em lista', icon: List },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os formatos' },
  { value: 'tv', label: 'Séries de TV' },
  { value: 'movie', label: 'Filmes' },
  { value: 'ova', label: 'OVA' },
  { value: 'ona', label: 'ONA' },
  { value: 'special', label: 'Especiais' },
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Mais populares' },
  { value: 'score', label: 'Melhor avaliação' },
  { value: 'newest', label: 'Mais recentes' },
];

function getStudioSort(sortBy) {
  if (sortBy === 'newest') return ['START_DATE_DESC'];
  if (sortBy === 'score') return ['SCORE_DESC'];
  return ['POPULARITY_DESC'];
}

function getInitialViewMode() {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  return saved === 'list' ? 'list' : 'grid';
}

export function StudioDetails() {
  const { id } = useParams();
  const [studio, setStudio] = useState(null);
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [viewMode, setViewMode] = useState(getInitialViewMode);
  const [sortBy, setSortBy] = useState('popularity');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  const { isFavorite, toggleFavorite, loading: favoriteLoading } = useFavoriteStudios(id);

  usePageTitle(studio?.titles?.[0]?.title || 'Estúdio');

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const fetchData = useEffectEvent(async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      if (!id?.startsWith(ANILIST_STUDIO_PREFIX)) {
        const legacyError = new Error('Identificador antigo de estúdio');
        legacyError.status = 404;
        throw legacyError;
      }

      const studioId = id.replace(ANILIST_STUDIO_PREFIX, '');
      const result = await anilistApi.getStudioDetails(
        studioId,
        pageNumber,
        25,
        getStudioSort(sortBy),
      );

      if (!result?.studio) {
        const notFoundError = new Error('Estúdio não encontrado');
        notFoundError.status = 404;
        throw notFoundError;
      }

      if (pageNumber === 1) setStudio(result.studio);

      const transformedAnimes = (result.data || [])
        .filter((anime) => {
          if (filterType === 'all') return true;
          const normalizedType = String(anime.type).toLocaleLowerCase('pt-BR');
          return normalizedType === filterType
            || (filterType === 'tv' && normalizedType === 'tv short');
        })
        .map((anime) => ({
          id: anime.mal_id,
          title: anime.title_english || anime.title,
          image: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url,
          smallImage: anime.images?.webp?.small_image_url
            || anime.images?.jpg?.small_image_url
            || anime.images?.webp?.image_url
            || anime.images?.jpg?.image_url,
          score: anime.score || 'N/A',
          genres: anime.genres?.map((genre) => genre.name).slice(0, 2).join(', ') || '',
          synopsis: anime.synopsis,
          type: anime.type,
          status: anime.status,
          episodes: anime.episodes,
          year: anime.year,
        }));

      setAnimes((current) => (
        pageNumber === 1 ? transformedAnimes : [...current, ...transformedAnimes]
      ));
      setHasMore(Boolean(result.pagination?.has_next_page));
      setPage(pageNumber);
    } catch (requestError) {
      console.error('Erro ao carregar o estúdio:', requestError);
      setError(requestError.status === 404 ? 'not-found' : 'unavailable');
    } finally {
      if (pageNumber === 1) setLoading(false);
      else setLoadingMore(false);
    }
  });

  useEffect(() => {
    fetchData(1);
  }, [id, sortBy, filterType, retryToken]);

  const loadMore = useEffectEvent(() => {
    if (!loadingMore && hasMore) fetchData(page + 1);
  });

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) loadMore();
    }, { rootMargin: '240px' });

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-bg-primary px-5 text-center text-text-primary">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-secondary text-text-secondary"><Building2 className="h-6 w-6" /></span>
        <h2 className="text-2xl font-black">
          {error === 'not-found' ? 'Estúdio não encontrado' : 'Estúdio temporariamente indisponível'}
        </h2>
        {error !== 'not-found' && (
          <button type="button" onClick={() => setRetryToken((value) => value + 1)} className="rounded-xl bg-button-accent px-5 py-2.5 font-bold text-text-on-primary">
            Tentar novamente
          </button>
        )}
        <Link to="/catalog" className="text-button-accent hover:underline">Voltar para o catálogo</Link>
      </div>
    );
  }

  const established = studio?.established
    ? new Date(studio.established).toLocaleDateString('pt-BR')
    : null;
  const displayTitle = studio?.titles?.[0]?.title || studio?.title || 'Carregando...';
  const studioImage = studio?.images?.webp?.large_image_url
    || studio?.images?.jpg?.large_image_url
    || studio?.images?.jpg?.image_url;

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] bg-bg-primary px-4 pb-20 pt-6 font-sans text-text-primary sm:px-6 lg:px-10">
      <div className="mb-5"><BackButton /></div>

      <section className="relative mb-8 overflow-hidden rounded-3xl border border-border-color bg-bg-secondary p-5 shadow-2xl shadow-black/10 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_12%_100%,rgba(34,211,238,0.10),transparent_28%)]" />
        {studio ? (
          <div className="relative grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center lg:gap-9">
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border-color bg-white p-6 shadow-xl md:aspect-square">
              {studioImage ? <img src={studioImage} alt={displayTitle} className="h-full w-full object-contain" /> : <Building2 className="h-20 w-20 text-zinc-300" />}
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-button-accent">Perfil do estúdio</p>
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="min-w-0 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{displayTitle}</h1>
                <button
                  type="button"
                  onClick={() => toggleFavorite(studio)}
                  disabled={favoriteLoading}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? `Deixar de seguir ${displayTitle}` : `Seguir ${displayTitle}`}
                  className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition-all disabled:cursor-wait disabled:opacity-60 ${
                    isFavorite
                      ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20'
                      : 'border-border-color bg-bg-tertiary/60 text-text-secondary hover:border-red-500/50 hover:text-red-400'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {favoriteLoading ? 'Verificando...' : isFavorite ? 'Seguindo' : 'Seguir estúdio'}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-text-secondary">
                {established && <span className="inline-flex items-center gap-2 rounded-xl border border-border-color bg-bg-primary/45 px-3 py-2"><Calendar className="h-4 w-4 text-button-accent" /> Desde {established}</span>}
                {studio.count > 0 && <span className="inline-flex items-center gap-2 rounded-xl border border-border-color bg-bg-primary/45 px-3 py-2"><Monitor className="h-4 w-4 text-button-accent" /> {studio.count.toLocaleString('pt-BR')} obras</span>}
                {studio.favorites > 0 && <span className="inline-flex items-center gap-2 rounded-xl border border-border-color bg-bg-primary/45 px-3 py-2"><MapPin className="h-4 w-4 text-button-accent" /> {studio.favorites.toLocaleString('pt-BR')} favoritos</span>}
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                {studio.about || `Conheça as produções do estúdio ${displayTitle}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative grid animate-pulse gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center lg:gap-9">
            <div className="aspect-video rounded-2xl bg-bg-tertiary md:aspect-square" />
            <div className="space-y-4"><div className="h-4 w-28 rounded bg-bg-tertiary" /><div className="h-12 w-3/4 rounded-xl bg-bg-tertiary" /><div className="h-9 w-64 rounded-xl bg-bg-tertiary" /><div className="h-20 max-w-2xl rounded-xl bg-bg-tertiary" /></div>
          </div>
        )}
      </section>

      <section className="mb-6 overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-xl shadow-black/5" aria-labelledby="studio-productions-title">
        <div className="flex flex-col gap-2 border-b border-border-color px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-button-accent">Catálogo do estúdio</p>
            <h2 id="studio-productions-title" className="mt-0.5 text-xl font-black text-text-primary sm:text-2xl">Produções</h2>
          </div>
          <span className="text-xs font-bold text-text-secondary">{loading ? 'Atualizando resultados...' : `${animes.length} ${animes.length === 1 ? 'obra carregada' : 'obras carregadas'}`}</span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(210px,0.8fr)_minmax(230px,1fr)_auto] lg:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary">Formato</span>
            <span className="relative block">
              <Clapperboard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-button-accent" />
              <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="w-full appearance-none rounded-xl border border-border-color bg-bg-primary/50 py-3 pl-10 pr-10 text-sm font-bold text-text-primary outline-none transition-colors hover:border-button-accent/40 focus:border-button-accent focus:ring-2 focus:ring-button-accent/15">
                {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary">Ordenar por</span>
            <span className="relative block">
              <ArrowDownUp className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-button-accent" />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full appearance-none rounded-xl border border-border-color bg-bg-primary/50 py-3 pl-10 pr-10 text-sm font-bold text-text-primary outline-none transition-colors hover:border-button-accent/40 focus:border-button-accent focus:ring-2 focus:ring-button-accent/15">
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            </span>
          </label>

          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary">Exibição</span>
            <ViewToggle value={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
          </div>
        </div>
      </section>

      <div className="min-h-[400px]">
        {loading && page === 1 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5' : 'grid grid-cols-1 gap-4'}>
            {Array.from({ length: viewMode === 'grid' ? 10 : 5 }, (_, index) => <SkeletonCard key={`studio-skeleton-${index}`} viewMode={viewMode} />)}
          </div>
        ) : animes.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5' : 'grid grid-cols-1 gap-4'}>
              {animes.map((anime) => (
                viewMode === 'grid'
                  ? <AnimeCard key={anime.id} {...anime} image={anime.image} />
                  : <AnimeListItem key={anime.id} {...anime} image={anime.image} />
              ))}
            </div>

            {(hasMore || loadingMore) && <div ref={observerTarget} className="mt-8 flex w-full justify-center py-8">{loadingMore && <Loader />}</div>}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-color bg-bg-secondary p-12 text-center">
            <Clapperboard className="h-9 w-9 text-text-secondary/40" />
            <p className="mt-4 text-lg font-black text-text-primary">Nenhuma produção neste filtro</p>
            <p className="mt-1 text-sm text-text-secondary">Tente outro formato ou volte para a ordenação padrão.</p>
            <button type="button" onClick={() => { setFilterType('all'); setSortBy('popularity'); }} className="mt-5 rounded-xl bg-button-accent px-4 py-2.5 text-sm font-black text-text-on-primary">Limpar filtros</button>
          </div>
        )}
      </div>
    </div>
  );
}
