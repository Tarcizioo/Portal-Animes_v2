import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimeCard } from "@/components/ui/AnimeCard";
import { AnimeListItem } from "@/components/ui/AnimeListItem";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useCatalog } from "@/hooks/useCatalog";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Search,
  X,
  Trash2,
  Calendar,
  MonitorPlay,
  Sparkles,
  LayoutGrid,
  List,
  AlertTriangle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { anilistApi } from "@/services/anilistApi";

const GENRES = [
  { id: 1, name: "Ação" },
  { id: 2, name: "Aventura" },
  { id: 4, name: "Comédia" },
  { id: 8, name: "Drama" },
  { id: 9, name: "Ecchi" },
  { id: 10, name: "Fantasia" },
  { id: 14, name: "Terror" },
  { id: 22, name: "Romance" },
  { id: 24, name: "Sci-Fi" },
  { id: 7, name: "Mistério" },
  { id: 40, name: "Psicológico" },
  { id: 18, name: "Mecha" },
  { id: 19, name: "Musical" },
  { id: 36, name: "Slice of Life" },
  { id: 37, name: "Sobrenatural" },
  { id: 30, name: "Esportes" },
  { id: 41, name: "Suspense" },
  { id: 23, name: "Escolar" },
  { id: 42, name: "Seinen" },
  { id: 27, name: "Shounen" },
  { id: 66, name: "Garotas Mágicas" },
  { id: 1001, name: "Isekai" },
  { id: 1002, name: "Histórico" },
  { id: 1003, name: "Militar" },
  { id: 1004, name: "Artes Marciais" },
  { id: 1005, name: "Espacial" },
];

const VIEW_OPTIONS = [
  { value: "grid", label: "", ariaLabel: "Visualizacao em grade", icon: LayoutGrid },
  { value: "list", label: "", ariaLabel: "Visualizacao em lista", icon: List },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

function CatalogSearch({ value, onChange, isPending, className, inputId }) {
  return (
    <div className={clsx("space-y-2", className)}>
      <label className="sr-only" htmlFor={inputId}>Pesquisar animes</label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          value={value}
          placeholder="Pesquisar por titulo..."
          className="w-full rounded-xl border-2 border-border-color bg-bg-secondary py-3 pl-11 pr-11 text-base text-text-primary transition-all placeholder-text-secondary/60 focus:border-button-accent focus:outline-none focus:ring-4 focus:ring-button-accent/10"
          onChange={(event) => onChange(event.target.value)}
        />
        {isPending ? (
          <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-button-accent" aria-hidden="true" />
        ) : value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpar pesquisa"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent p-2 text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {isPending ? "Preparando pesquisa" : ""}
      </span>
    </div>
  );
}

export function Catalog() {
  const {
    animes,
    loading,
    error,
    retry,
    isRetrying,
    isSearchPending,
    loadMore,
    hasMore,
    filters,
    updateFilter,
    clearFilters,
  } = useCatalog();

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();
  const [luckyLoading, setLuckyLoading] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem("anime_catalog_view_mode");
    return saved || "grid";
  });

  // Salva ViewMode
  useEffect(() => {
    localStorage.setItem("anime_catalog_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!showMobileFilters) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowMobileFilters(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMobileFilters]);

  usePageTitle("Catálogo");

  const handleLuckyParams = async () => {
    try {
      setLuckyLoading(true);
      // Delay para feedback visual
      await new Promise((resolve) => setTimeout(resolve, 800));

      const data = await anilistApi.getRandomAnime();
      if (!data?.data?.mal_id) throw new Error("Erro ao buscar anime aleatório");

      const randomAnimeId = data?.data?.mal_id;

      navigate(`/anime/${randomAnimeId}`);
    } catch (error) {
      console.error("Erro no 'Estou com sorte':", error);
    } finally {
      setLuckyLoading(false);
    }
  };


  const handleStatusToggle = (statusValue) => {
    updateFilter("status", filters.status === statusValue ? "" : statusValue);
  };

  const handleGenreToggle = (genreId) => {
    const currentGenres = filters.genres;
    if (currentGenres.includes(genreId)) {
      updateFilter(
        "genres",
        currentGenres.filter((id) => id !== genreId),
      );
    } else {
      updateFilter("genres", [...currentGenres, genreId]);
    }
  };

  const hasActiveFilters =
    filters.q ||
    filters.status ||
    filters.genres.length > 0 ||
    filters.year ||
    filters.season ||
    filters.type ||
    filters.producers;
  const skeletonCount = animes.length === 0 ? 12 : 4;
  const activeFilterCount = [
    filters.q,
    filters.status,
    filters.year,
    filters.season,
    filters.type,
    filters.producers,
    filters.genres.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <div className="mb-8 border-b border-border-color pb-6">
        <h1 className="text-4xl font-black text-text-primary mb-2 tracking-tight">
          Catálogo
        </h1>
        <p className="text-lg text-text-secondary">
          Descubra, filtre e encontre seus animes favoritos.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* --- SIDEBAR DE FILTROS --- */}
        <aside
          role={showMobileFilters ? "dialog" : undefined}
          aria-modal={showMobileFilters ? "true" : undefined}
          aria-label={showMobileFilters ? "Filtros do catalogo" : undefined}
          className={clsx(
            "lg:w-72 flex-shrink-0 space-y-8 pb-24 lg:pb-0",
            showMobileFilters
              ? "fixed inset-0 z-[60] bg-bg-secondary p-6 overflow-y-auto"
              : "hidden lg:block",
          )}
        >
          <div className="flex items-center justify-between lg:hidden mb-6 border-b border-border-color pb-4">
            <h2 className="text-2xl font-bold text-text-primary">Filtros</h2>
            <button
              onClick={() => setShowMobileFilters(false)}
              aria-label="Fechar filtros"
              className="p-2 bg-bg-tertiary rounded-full text-text-primary"
            >
              <X />
            </button>
          </div>

          {/* Busca - VISIBILIDADE MELHORADA */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-button-accent" /> Pesquisar
            </h3>
            <CatalogSearch
              inputId="catalog-search-sidebar"
              value={filters.q}
              onChange={(value) => updateFilter("q", value)}
              isPending={isSearchPending}
            />
          </div>

          {/* Ano e Temporada e Formato */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                {" "}
                <Calendar className="w-3.5 h-3.5 text-button-accent" /> Ano{" "}
              </h3>
              <select
                value={filters.year}
                onChange={(e) => updateFilter("year", e.target.value)}
                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-2 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer appearance-none"
              >
                <option value="">Todos</option>
                {Array.from(
                  { length: 45 },
                  (_, i) => new Date().getFullYear() + 1 - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                {" "}
                Temp.{" "}
              </h3>
              <select
                value={filters.season}
                onChange={(e) => updateFilter("season", e.target.value)}
                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-2 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer appearance-none"
              >
                <option value="">Todas</option>
                <option value="winter">Inverno</option>
                <option value="spring">Primavera</option>
                <option value="summer">Verão</option>
                <option value="fall">Outono</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              {" "}
              <MonitorPlay className="w-3.5 h-3.5 text-button-accent" />{" "}
              Formato{" "}
            </h3>
            <select
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
              className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer"
            >
              <option value="">Todos os formatos</option>
              <option value="tv">TV (Séries)</option>
              <option value="movie">Filmes</option>
              <option value="ova">OVAs</option>
              <option value="special">Especiais</option>
              <option value="ona">ONAs (Internet)</option>
              <option value="music">Musical</option>
            </select>
          </div>

          {/* Streaming / Plataforma */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              {" "}
              <MonitorPlay className="w-3.5 h-3.5 text-button-accent" />{" "}
              Plataforma{" "}
            </h3>
            <select
              value={filters.producers || ""}
              onChange={(e) => updateFilter("producers", e.target.value)}
              className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer"
            >
              <option value="">Todas</option>
              <option value="1977">Netflix</option>
              <option value="1468">Crunchyroll</option>
              <option value="102">Funimation</option>
              <option value="417">Disney+</option>
              <option value="1695">Hulu</option>
            </select>
          </div>

          {/* Status - MAIS NÍTIDO */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-button-accent" />{" "}
              Status
            </h3>
            <div className="flex flex-col gap-2">
              {[
                {
                  val: "airing",
                  label: "Em Lançamento",
                  color: "bg-green-500",
                },
                { val: "complete", label: "Completo", color: "bg-blue-500" },
                { val: "upcoming", label: "Em Breve", color: "bg-purple-500" },
              ].map((item) => (
                <Motion.button
                  type="button"
                  key={item.val}
                  aria-pressed={filters.status === item.val}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStatusToggle(item.val)}
                  className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors border-2
                            ${
                              filters.status === item.val
                                ? "bg-bg-secondary border-button-accent text-text-primary shadow-lg shadow-button-accent/10"
                                : "bg-bg-secondary/50 border-transparent hover:bg-bg-secondary hover:border-border-color text-text-secondary hover:text-text-primary"
                            }
                        `}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${filters.status === item.val ? item.color : "bg-gray-600"}`}
                  />
                  <span className="font-medium">{item.label}</span>
                </Motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-button-accent" /> Gêneros
              </h3>
              {filters.genres.length > 0 && (
                <span className="text-xs bg-button-accent text-text-on-primary font-bold px-2 py-0.5 rounded-full">
                  {filters.genres.length}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const isSelected = filters.genres.includes(g.id);
                return (
                  <Motion.button
                    type="button"
                    key={g.id}
                    aria-pressed={isSelected}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleGenreToggle(g.id)}
                    className={`
                            text-sm px-4 py-2 rounded-lg border transition-colors font-medium
                            ${
                              isSelected
                                ? "bg-button-accent border-button-accent text-text-on-primary shadow-md shadow-button-accent/20"
                                : "bg-bg-secondary border-border-color text-text-secondary hover:border-border-color/80 hover:text-text-primary hover:bg-bg-tertiary"
                            }
                        `}
                  >
                    {g.name}
                  </Motion.button>
                );
              })}
            </div>
          </div>

          {/* Botão Estou com Sorte */}
          <Motion.button
            onClick={handleLuckyParams}
            disabled={luckyLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 transition-all text-sm font-bold uppercase tracking-wider relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Sparkles
              className={`w-4 h-4 ${luckyLoading ? "animate-spin" : ""}`}
            />
            {luckyLoading ? "Sorteando..." : "Estou com Sorte"}
          </Motion.button>

          {/* Botão Limpar */}
          {hasActiveFilters && (
            <Motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-bold uppercase tracking-wider"
            >
              <Trash2 className="w-4 h-4" /> Limpar Filtros
            </Motion.button>
          )}

          <div className="sticky -bottom-6 -mx-6 border-t border-border-color bg-bg-secondary/95 p-4 backdrop-blur-xl lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="w-full rounded-xl bg-button-accent py-3.5 font-bold text-text-on-primary shadow-lg shadow-button-accent/20"
            >
              Ver {animes.length > 0 ? `${animes.length} animes` : "resultados"}
            </button>
          </div>
        </aside>

        {/* --- ÁREA PRINCIPAL --- */}
        <div className="flex-1 min-w-0">
          <CatalogSearch
            inputId="catalog-search-mobile"
            value={filters.q}
            onChange={(value) => updateFilter("q", value)}
            isPending={isSearchPending}
            className="mb-4 lg:hidden"
          />

          {/* Barra Superior - MELHOR CONTRASTE */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-5 bg-bg-secondary border border-border-color rounded-2xl shadow-xl shadow-shadow-color/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileFilters(true)}
                aria-label="Abrir filtros"
                className="relative lg:hidden p-2.5 bg-button-accent text-text-on-primary rounded-lg shadow-lg shadow-button-accent/20"
              >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-sm font-medium text-text-secondary">
                {animes.length} {animes.length === 1 ? "anime carregado" : "animes carregados"}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* View Mode Toggles */}
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
                options={VIEW_OPTIONS}
              />

              <span className="text-sm font-medium text-text-secondary hidden sm:inline whitespace-nowrap pl-2 border-l border-border-color">
                Ordenar por:
              </span>
              <div className="relative group w-full sm:w-auto">
                <select
                  aria-label="Ordenar catalogo"
                  className="w-full sm:w-auto appearance-none bg-bg-tertiary border-2 border-border-color text-text-primary pl-4 pr-12 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/20 cursor-pointer hover:bg-bg-secondary transition-colors"
                  value={filters.orderBy}
                  onChange={(e) => updateFilter("orderBy", e.target.value)}
                >
                  <optgroup label="Destaques">
                    <option value="ranking">🏆 Top Ranking (Geral)</option>
                    <option value="popularity">🔥 Mais Populares</option>
                    <option value="favorites">❤️ Mais Favoritados</option>
                  </optgroup>
                  <optgroup label="Outros">
                    <option value="score">⭐ Melhor Nota (Filtro)</option>
                    <option value="newest">📅 Lançamentos Recentes</option>
                    <option value="az">🔤 Ordem Alfabética (A-Z)</option>
                    <option value="za">🔤 Ordem Alfabética (Z-A)</option>
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <h2 className="font-bold text-text-primary">
                    {animes.length > 0 ? "Nao foi possivel carregar mais resultados" : "O catalogo esta temporariamente indisponivel"}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">A API pode estar ocupada. Aguarde alguns segundos e tente novamente.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={retry}
                disabled={isRetrying}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={clsx("h-4 w-4", isRetrying && "animate-spin")} />
                {isRetrying ? "Tentando..." : "Tentar novamente"}
              </button>
            </div>
          )}

          {/* Grid / List */}
          <Motion.div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                : "flex flex-col gap-4"
            }
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${viewMode}-${JSON.stringify(filters)}-${animes.length > 0}`} // Re-renders on data load
          >
            <AnimatePresence mode="popLayout">
              {animes.map((anime) => (
                <Motion.div
                  key={`${anime.id}-${filters.orderBy}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  {viewMode === "grid" ? (
                    <AnimeCard
                      key={`${anime.id}-${filters.orderBy}-card`}
                      {...anime}
                      image={
                        anime.images?.webp?.large_image_url ||
                        anime.images?.jpg?.large_image_url ||
                        anime.image
                      }
                    />
                  ) : (
                    <AnimeListItem
                      key={`${anime.id}-${filters.orderBy}-list`}
                      {...anime}
                      image={
                        anime.images?.webp?.large_image_url ||
                        anime.images?.jpg?.large_image_url ||
                        anime.image
                      }
                    />
                  )}
                </Motion.div>
              ))}
            </AnimatePresence>

            {loading &&
              Array.from({ length: skeletonCount }).map((_, i) => (
                <Motion.div key={`skeleton-${i}`} variants={itemVariants}>
                  {viewMode === "grid" ? (
                    <SkeletonCard />
                  ) : (
                    <div className="h-48 bg-bg-secondary rounded-xl animate-pulse" />
                  )}
                </Motion.div>
              ))}
          </Motion.div>

          {!loading && !error && animes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Search className="w-10 h-10 text-text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                {filters.q.trim() ? `Nada encontrado para "${filters.q.trim()}"` : "Nenhum resultado encontrado"}
              </h3>
              <p className="text-text-secondary mb-6">
                Tente usar outros termos ou limpe os filtros.
              </p>
              <Motion.button
                onClick={clearFilters}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-button-accent hover:bg-button-accent/90 text-text-on-primary rounded-xl font-bold transition-all shadow-lg shadow-button-accent/20"
              >
                Limpar todos os filtros
              </Motion.button>
            </div>
          )}

          {hasMore && animes.length > 0 && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex min-w-52 items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-secondary px-6 py-3 font-bold text-text-primary shadow-lg shadow-shadow-color/10 transition-colors hover:border-button-accent hover:text-button-accent disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                {loading ? "Carregando..." : "Carregar mais animes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
