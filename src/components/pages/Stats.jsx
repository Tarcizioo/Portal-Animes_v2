import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity, BarChart3, CalendarDays, CheckCircle2, Clock3, Clapperboard,
    Filter, Heart, Layers3, LibraryBig, RotateCcw, Sparkles, Star, Trophy, Tv,
} from 'lucide-react';
import { motion as Motion } from 'framer-motion';

import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useAnimeStats } from '@/hooks/useAnimeStats';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Loader } from '@/components/ui/Loader';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

const StatusDistributionChart = lazy(() => import('@/components/stats/StatsCharts').then((module) => ({ default: module.StatusDistributionChart })));
const ScoreDistributionChart = lazy(() => import('@/components/stats/StatsCharts').then((module) => ({ default: module.ScoreDistributionChart })));
const TypeDistributionChart = lazy(() => import('@/components/stats/StatsCharts').then((module) => ({ default: module.TypeDistributionChart })));

const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos os status' },
    { value: 'watching', label: 'Assistindo' },
    { value: 'completed', label: 'Completos' },
    { value: 'plan_to_watch', label: 'Planejados' },
    { value: 'paused', label: 'Pausados' },
    { value: 'dropped', label: 'Dropados' },
];

function uniqueOptions(items, field) {
    return [...new Set(items.map((item) => item[field]).filter(Boolean))]
        .sort((a, b) => (typeof a === 'number' ? b - a : String(a).localeCompare(String(b))));
}

function countByStatus(library, status) {
    return library.filter((anime) => anime.status === status).length;
}

export function Stats() {
    usePageTitle('Estatísticas pessoais');
    const { library, loading } = useAnimeLibrary();
    const [status, setStatus] = useState('all');
    const [year, setYear] = useState('all');
    const [format, setFormat] = useState('all');
    const [showAllGenres, setShowAllGenres] = useState(false);

    const years = useMemo(() => uniqueOptions(library, 'year'), [library]);
    const formats = useMemo(() => uniqueOptions(library, 'type'), [library]);
    const filteredLibrary = useMemo(() => library.filter((anime) => {
        if (status !== 'all' && anime.status !== status) return false;
        if (year !== 'all' && String(anime.year) !== year) return false;
        if (format !== 'all' && anime.type !== format) return false;
        return true;
    }), [format, library, status, year]);
    const stats = useAnimeStats(filteredLibrary);

    const completedCount = countByStatus(filteredLibrary, 'completed');
    const watchingCount = countByStatus(filteredLibrary, 'watching');
    const plannedCount = countByStatus(filteredLibrary, 'plan_to_watch');
    const completionRate = filteredLibrary.length > 0
        ? Math.round((completedCount / filteredLibrary.length) * 100)
        : 0;
    const topGenre = stats.genres[0];
    const topFormat = stats.types[0];
    const hasFilters = status !== 'all' || year !== 'all' || format !== 'all';
    const visibleGenres = showAllGenres ? stats.genres : stats.genres.slice(0, 8);

    const resetFilters = () => {
        setStatus('all');
        setYear('all');
        setFormat('all');
    };

    if (loading) return <div className="flex min-h-[65vh] items-center justify-center"><Loader /></div>;

    if (!library.length) return <EmptyStats />;

    return (
        <div className="mx-auto max-w-[1600px] space-y-6 p-4 pb-24 md:p-7 lg:p-10">
            <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[#11141c] px-5 py-7 text-white shadow-2xl sm:px-8 sm:py-10 lg:px-11">
                <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.18),transparent_24%),radial-gradient(circle_at_12%_84%,rgba(99,102,241,0.24),transparent_30%)]" />
                <div className="absolute -right-20 top-1/2 hidden h-72 w-72 -translate-y-1/2 rounded-full border border-white/10 lg:block" />
                <div className="absolute -right-8 top-1/2 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-cyan-300/20 lg:block" />
                <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                            <Sparkles className="h-3.5 w-3.5" /> Retrato da sua biblioteca
                        </span>
                        <h1 className="mt-4 text-3xl font-black leading-[0.95] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                            Seu jeito de assistir,<br /><span className="text-cyan-300">traduzido em números.</span>
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                            Entenda o ritmo da sua jornada, os gêneros que mais aparecem e como suas escolhas se distribuem pela coleção.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:flex">
                        <HeroMetric label="Conclusão" value={`${completionRate}%`} />
                        <HeroMetric label="Em andamento" value={watchingCount} />
                    </div>
                </div>
            </section>

            <StatsFilterBar
                status={status}
                year={year}
                format={format}
                years={years}
                formats={formats}
                resultCount={filteredLibrary.length}
                hasFilters={hasFilters}
                onStatusChange={setStatus}
                onYearChange={setYear}
                onFormatChange={setFormat}
                onReset={resetFilters}
            />

            {filteredLibrary.length === 0 ? (
                <NoFilteredResults onReset={resetFilters} />
            ) : (
                <>
                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <MetricCard icon={LibraryBig} label="Títulos" value={stats.overview.totalAnimes} detail="na seleção atual" tone="blue" />
                        <MetricCard icon={Tv} label="Episódios" value={stats.overview.totalEpisodes} detail="marcados como vistos" tone="cyan" />
                        <MetricCard icon={Clock3} label="Tempo" value={`${stats.overview.totalDays}d`} detail={`${stats.overview.totalHours} horas`} tone="violet" />
                        <MetricCard icon={Star} label="Nota média" value={stats.overview.averageScore || '—'} detail="somente avaliados" tone="amber" />
                        <MetricCard icon={Heart} label="Favoritos" value={stats.overview.favoritesCount} detail="escolhas pessoais" tone="rose" />
                    </section>

                    <Suspense fallback={<ChartsLoadingState />}>
                        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
                            <Panel
                                eyebrow="Avaliações"
                                title="Como suas notas se distribuem"
                                description="A altura combina todas as situações da biblioteca; as cores mostram o status."
                                icon={BarChart3}
                            >
                                <div className="h-[300px] sm:h-[340px]"><ScoreDistributionChart data={stats.scoreDistribution} detailed /></div>
                            </Panel>
                            <Panel
                                eyebrow="Fluxo"
                                title="Estado da biblioteca"
                                description={`${completedCount} completos e ${plannedCount} aguardando a próxima sessão.`}
                                icon={Activity}
                            >
                                <div className="h-[300px]"><StatusDistributionChart data={stats.status} /></div>
                            </Panel>
                        </section>

                        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                            <Panel
                                eyebrow="Formatos"
                                title="O que ocupa sua coleção"
                                description={topFormat ? `${topFormat.name} lidera com ${topFormat.value} títulos.` : 'Sem formatos identificados.'}
                                icon={Clapperboard}
                            >
                                <div className="h-[300px]"><TypeDistributionChart data={stats.types} /></div>
                            </Panel>
                            <InsightsPanel
                                completionRate={completionRate}
                                topGenre={topGenre}
                                averageScore={stats.overview.averageScore}
                                watchingCount={watchingCount}
                                plannedCount={plannedCount}
                            />
                        </section>
                    </Suspense>

                    <TopRatedSection animes={stats.topRated.slice(0, 6)} />

                    <Panel
                        eyebrow="Afinidades"
                        title="Gêneros que definem sua biblioteca"
                        description="Participação, nota média e tempo estimado por gênero."
                        icon={Layers3}
                        action={stats.genres.length > 8 ? (
                            <button type="button" onClick={() => setShowAllGenres((value) => !value)} className="text-xs font-black text-primary hover:text-primary-hover">
                                {showAllGenres ? 'Mostrar menos' : `Ver todos (${stats.genres.length})`}
                            </button>
                        ) : null}
                    >
                        <div className="space-y-2">
                            {visibleGenres.map((genre, index) => (
                                <GenreRow key={genre.name} genre={genre} index={index} maxTotal={stats.genres[0]?.total || 1} />
                            ))}
                        </div>
                    </Panel>
                </>
            )}
        </div>
    );
}

function HeroMetric({ label, value }) {
    return (
        <div className="min-w-32 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
        </div>
    );
}

function StatsFilterBar({ status, year, format, years, formats, resultCount, hasFilters, onStatusChange, onYearChange, onFormatChange, onReset }) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-border-color bg-bg-secondary p-4 shadow-lg shadow-shadow-color/5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Filter className="h-4 w-4" /></span>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-text-primary">Recorte da análise</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{resultCount} títulos considerados</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <FilterSelect label="Status" value={status} onChange={onStatusChange} options={STATUS_OPTIONS} />
                <FilterSelect label="Ano" value={year} onChange={onYearChange} options={[{ value: 'all', label: 'Todos os anos' }, ...years.map((item) => ({ value: String(item), label: String(item) }))]} icon={CalendarDays} />
                <FilterSelect label="Formato" value={format} onChange={onFormatChange} options={[{ value: 'all', label: 'Todos os formatos' }, ...formats.map((item) => ({ value: item, label: item }))]} icon={Clapperboard} />
                {hasFilters && (
                    <button type="button" onClick={onReset} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border-color px-3 py-2.5 text-xs font-bold text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary sm:col-span-1">
                        <RotateCcw className="h-3.5 w-3.5" /> Limpar
                    </button>
                )}
            </div>
        </section>
    );
}

function FilterSelect({ label, value, onChange, options, icon: Icon }) {
    return (
        <label className="relative min-w-0">
            <span className="sr-only">{label}</span>
            {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-secondary" />}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`w-full appearance-none rounded-xl border border-border-color bg-bg-tertiary py-2.5 pr-8 text-xs font-bold text-text-primary outline-none transition-colors hover:border-primary/35 focus:border-primary ${Icon ? 'pl-9' : 'pl-3'}`}
            >
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
        </label>
    );
}

const METRIC_TONES = {
    blue: 'bg-blue-500/10 text-blue-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    violet: 'bg-violet-500/10 text-violet-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
};

function MetricCard({ icon: Icon, label, value, detail, tone }) {
    return (
        <Motion.article whileHover={{ y: -3 }} className="rounded-2xl border border-border-color bg-bg-secondary p-4 shadow-sm sm:p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${METRIC_TONES[tone]}`}><Icon className="h-4.5 w-4.5" /></div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">{label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-text-primary sm:text-3xl">{value}</p>
            <p className="mt-1 truncate text-[10px] text-text-secondary/75">{detail}</p>
        </Motion.article>
    );
}

function Panel({ eyebrow, title, description, icon: Icon, action, children }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-border-color bg-bg-secondary shadow-sm">
            <header className="flex items-start justify-between gap-4 border-b border-border-color/70 px-5 py-5 sm:px-6">
                <div className="flex min-w-0 gap-3">
                    <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4.5 w-4.5" /></span>
                    <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
                        <h2 className="mt-1 text-base font-black tracking-tight text-text-primary sm:text-lg">{title}</h2>
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p>
                    </div>
                </div>
                {action}
            </header>
            <div className="p-4 sm:p-6">{children}</div>
        </section>
    );
}

function InsightsPanel({ completionRate, topGenre, averageScore, watchingCount, plannedCount }) {
    const scoreText = Number(averageScore) >= 8
        ? 'Você costuma valorizar bastante o que avalia.'
        : Number(averageScore) >= 6
            ? 'Suas notas mantêm um equilíbrio entre rigor e diversão.'
            : 'Você é criterioso e não distribui notas altas facilmente.';

    const insights = [
        { label: 'Ritmo de conclusão', value: `${completionRate}%`, text: `${watchingCount} títulos seguem em andamento.`, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
        { label: 'Afinidade principal', value: topGenre?.name || '—', text: topGenre ? `${topGenre.total} títulos carregam esse gênero.` : 'Adicione gêneros aos títulos para descobrir.', icon: Trophy, color: 'text-amber-400 bg-amber-500/10' },
        { label: 'Perfil de notas', value: averageScore || '—', text: scoreText, icon: Star, color: 'text-cyan-400 bg-cyan-500/10' },
        { label: 'Próximos da fila', value: plannedCount, text: plannedCount === 1 ? 'Um anime esperando por você.' : 'Animes esperando por você.', icon: Sparkles, color: 'text-violet-400 bg-violet-500/10' },
    ];

    return (
        <section className="rounded-3xl border border-border-color bg-bg-secondary p-5 shadow-sm sm:p-6">
            <div className="mb-5">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">Leitura rápida</p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-text-primary">O que seus dados contam</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {insights.map((insight) => (
                    <article key={insight.label} className="rounded-2xl border border-border-color bg-bg-primary/40 p-4">
                        <div className={`grid h-9 w-9 place-items-center rounded-xl ${insight.color}`}><insight.icon className="h-4 w-4" /></div>
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.14em] text-text-secondary">{insight.label}</p>
                        <p className="mt-1 truncate text-xl font-black text-text-primary">{insight.value}</p>
                        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{insight.text}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function TopRatedSection({ animes }) {
    if (!animes.length) return null;

    return (
        <section className="rounded-3xl border border-border-color bg-bg-secondary p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">Seu pódio</p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-text-primary">Mais bem avaliados por você</h2>
                </div>
                <Trophy className="h-6 w-6 text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {animes.map((anime, index) => (
                    <Link key={anime.id} to={`/anime/${anime.id}`} className="group min-w-0">
                        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-bg-tertiary">
                            <ResponsiveImage src={anime.image} alt={anime.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                            <span className="absolute left-2 top-2 grid h-7 min-w-7 place-items-center rounded-lg border border-white/15 bg-black/55 px-1 text-[10px] font-black text-white backdrop-blur-md">#{index + 1}</span>
                            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2 py-1 text-[10px] font-black text-black"><Star className="h-3 w-3 fill-current" /> {anime.score}</span>
                        </div>
                        <h3 className="mt-2 truncate text-xs font-black text-text-primary transition-colors group-hover:text-primary">{anime.title}</h3>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function GenreRow({ genre, index, maxTotal }) {
    const width = Math.max(8, (genre.total / maxTotal) * 100);

    return (
        <article className="grid grid-cols-[32px_minmax(0,1fr)_58px] items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-bg-tertiary/55 sm:grid-cols-[40px_minmax(0,1fr)_90px_90px]">
            <span className="text-center text-xs font-black text-text-secondary/60">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="truncate text-sm font-black text-text-primary">{genre.name}</h3>
                    <span className="text-[10px] font-bold text-text-secondary sm:hidden">{genre.total}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-primary">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${width}%` }} />
                </div>
            </div>
            <div className="hidden text-right sm:block">
                <p className="text-sm font-black text-text-primary">{genre.total}</p>
                <p className="text-[9px] uppercase text-text-secondary">títulos</p>
            </div>
            <div className="text-right">
                <p className="inline-flex items-center gap-1 text-sm font-black text-text-primary"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {genre.averageScore || '—'}</p>
                <p className="text-[9px] uppercase text-text-secondary">{genre.daysWatched}d vistos</p>
            </div>
        </article>
    );
}

function ChartsLoadingState() {
    return (
        <div className="grid gap-5 lg:grid-cols-2" aria-label="Carregando gráficos">
            {[0, 1].map((item) => (
                <div key={item} className="h-[390px] animate-pulse rounded-3xl border border-border-color bg-bg-secondary p-6">
                    <div className="h-5 w-44 rounded bg-bg-tertiary" />
                    <div className="mt-8 h-72 rounded-2xl bg-bg-tertiary/70" />
                </div>
            ))}
        </div>
    );
}

function EmptyStats() {
    return (
        <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center p-6 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-3xl border border-primary/20 bg-primary/10 text-primary"><BarChart3 className="h-9 w-9" /></span>
            <h1 className="mt-6 text-3xl font-black tracking-tight text-text-primary">Sua história começa na biblioteca.</h1>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">Adicione alguns animes e registre seu progresso para transformar essa página em um retrato dos seus hábitos.</p>
            <Link to="/catalog" className="mt-7 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary/20">Explorar catálogo</Link>
        </div>
    );
}

function NoFilteredResults({ onReset }) {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border-color bg-bg-secondary/55 p-6 text-center">
            <Filter className="h-9 w-9 text-text-secondary/40" />
            <h2 className="mt-4 text-xl font-black text-text-primary">Nenhum título nesse recorte</h2>
            <p className="mt-2 text-sm text-text-secondary">Altere os filtros para voltar a enxergar sua biblioteca completa.</p>
            <button type="button" onClick={onReset} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-black text-primary"><RotateCcw className="h-3.5 w-3.5" /> Limpar filtros</button>
        </div>
    );
}