import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowUpRight,
    Loader2,
    LockKeyhole,
    LogIn,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    UserRoundSearch,
    Users,
    X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { searchPublicUsers } from '@/services/userSearch';

function getInitials(profile) {
    const name = profile.displayName || profile.name || 'Usuário';
    return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toLocaleUpperCase('pt-BR');
}

export function UserSearchModal({ isOpen, onClose }) {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [partialFailure, setPartialFailure] = useState(false);
    const [retryToken, setRetryToken] = useState(0);
    const requestSequence = useRef(0);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (!isOpen || !currentUser || debouncedTerm.length < 2) {
            return undefined;
        }

        const requestId = ++requestSequence.current;
        let active = true;

        Promise.resolve()
            .then(() => {
                if (!active || requestId !== requestSequence.current) return null;
                setLoading(true);
                setError(null);
                setPartialFailure(false);
                return searchPublicUsers(debouncedTerm);
            })
            .then((response) => {
                if (!response || !active || requestId !== requestSequence.current) return;
                const { users, partialFailure: hasPartialFailure } = response;
                setResults(users);
                setPartialFailure(hasPartialFailure);
            })
            .catch((searchError) => {
                if (!active || requestId !== requestSequence.current) return;
                console.error('[user-search] Search failed:', searchError);
                setResults([]);
                setError('Não foi possível consultar a comunidade agora.');
            })
            .finally(() => {
                if (active && requestId === requestSequence.current) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [currentUser, debouncedTerm, isOpen, retryToken]);

    const handleClose = () => {
        requestSequence.current += 1;
        setSearchTerm('');
        setDebouncedTerm('');
        setResults([]);
        setLoading(false);
        setError(null);
        setPartialFailure(false);
        onClose();
    };

    const handleSignIn = () => {
        handleClose();
        navigate('/login');
    };

    const searchReady = Boolean(currentUser) && debouncedTerm.length >= 2;
    const searchLoading = searchReady && loading;
    const showInitialState = debouncedTerm.length < 2 && !searchLoading;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="xl"
            title={
                <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                        <UserRoundSearch className="h-4 w-4" />
                    </span>
                    Explorar comunidade
                </span>
            }
            subtitle="Encontre pessoas, conheça novos gostos e descubra o próximo anime para a sua lista."
            contentClassName="p-0"
        >
            <div className="relative overflow-hidden border-b border-border-color px-5 py-5 sm:px-7 sm:py-6">
                <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative">
                    <label htmlFor="community-search" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-text-secondary">
                        Buscar por nome
                    </label>
                    <div className={`relative rounded-2xl border bg-bg-primary/75 shadow-inner transition-all ${currentUser ? 'border-border-color focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10' : 'border-border-color opacity-60'}`}>
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                        <input
                            id="community-search"
                            type="search"
                            placeholder={currentUser ? 'Ex.: Tarcízio, Sakura, João...' : 'Entre para pesquisar usuários'}
                            autoFocus={Boolean(currentUser)}
                            disabled={!currentUser}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="h-14 w-full rounded-2xl bg-transparent pl-12 pr-24 text-sm font-semibold text-text-primary outline-none placeholder:font-normal placeholder:text-text-secondary/55 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                            {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            {searchTerm && !searchLoading && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Limpar pesquisa"
                                    className="grid h-8 w-8 place-items-center rounded-lg bg-bg-tertiary p-0 text-text-secondary hover:text-text-primary"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <kbd className="hidden rounded-md border border-border-color bg-bg-tertiary px-2 py-1 text-[10px] font-bold text-text-secondary sm:block">2+ letras</kbd>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-h-[340px] px-5 py-5 sm:px-7 sm:py-6" aria-live="polite">
                {!currentUser ? (
                    <div className="relative grid min-h-[300px] place-items-center overflow-hidden rounded-3xl border border-border-color bg-bg-primary/40 px-6 text-center">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_48%)]" />
                        <div className="relative max-w-md">
                            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
                                <LockKeyhole className="h-7 w-7" />
                            </span>
                            <h3 className="mt-5 text-xl font-black text-text-primary">A comunidade fica melhor com você</h3>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                                Entre com sua conta para encontrar perfis públicos e acessar as conexões sociais com segurança.
                            </p>
                            <button
                                type="button"
                                onClick={handleSignIn}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
                            >
                                <LogIn className="h-4 w-4" /> Entrar ou criar conta
                            </button>
                            {error && <p className="mt-3 text-xs font-semibold text-red-400">{error}</p>}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Somente perfis públicos aparecem aqui
                            </div>
                            {searchReady && !searchLoading && !error && (
                                <span className="rounded-full border border-border-color bg-bg-tertiary/60 px-3 py-1 text-[11px] font-bold text-text-secondary">
                                    {results.length} {results.length === 1 ? 'perfil encontrado' : 'perfis encontrados'}
                                </span>
                            )}
                        </div>

                        {partialFailure && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                                <AlertCircle className="h-3.5 w-3.5" /> Alguns perfis antigos podem não aparecer nesta busca.
                            </div>
                        )}

                        {searchLoading ? (
                            <div className="space-y-3" data-testid="user-search-loading">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={`user-skeleton-${index}`} className="flex animate-pulse items-center gap-4 rounded-2xl border border-border-color bg-bg-primary/30 p-3.5">
                                        <div className="h-14 w-14 rounded-2xl bg-bg-tertiary" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 w-36 rounded bg-bg-tertiary" />
                                            <div className="h-3 w-56 max-w-full rounded bg-bg-tertiary/70" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="grid min-h-[260px] place-items-center rounded-3xl border border-dashed border-red-500/25 bg-red-500/5 px-6 text-center">
                                <div>
                                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-500/10 text-red-400">
                                        <AlertCircle className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-4 font-black text-text-primary">A busca não respondeu</h3>
                                    <p className="mt-1 text-sm text-text-secondary">{error}</p>
                                    <button
                                        type="button"
                                        onClick={() => setRetryToken((value) => value + 1)}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border-color bg-bg-tertiary px-4 py-2 text-xs font-black text-text-primary hover:border-primary/40"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
                                    </button>
                                </div>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2" data-testid="user-search-results">
                                {results.map((profile) => {
                                    const displayName = profile.displayName || profile.name || 'Usuário';
                                    const handle = profile.searchName || displayName.toLocaleLowerCase('pt-BR').replace(/\s+/g, '.');
                                    const genres = Array.isArray(profile.favoriteGenres) ? profile.favoriteGenres.slice(0, 2) : [];

                                    return (
                                        <Link
                                            key={profile.uid}
                                            to={`/u/${profile.uid}`}
                                            onClick={handleClose}
                                            className="group relative flex min-h-28 items-center gap-3.5 overflow-hidden rounded-2xl border border-border-color bg-bg-primary/40 p-3.5 text-inherit shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-bg-tertiary/65 hover:shadow-lg hover:shadow-primary/5"
                                        >
                                            <div className="relative grid h-14 w-14 flex-shrink-0 place-items-center overflow-hidden rounded-2xl border border-border-color bg-gradient-to-br from-primary/35 to-cyan-400/15 text-sm font-black text-text-primary group-hover:border-primary/50">
                                                <span>{getInitials(profile)}</span>
                                                {profile.photoURL && (
                                                    <img
                                                        src={profile.photoURL}
                                                        alt=""
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="truncate text-sm font-black text-text-primary group-hover:text-primary">{displayName}</h4>
                                                    {profile.uid === currentUser.uid && (
                                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">Você</span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 truncate text-[11px] font-semibold text-text-secondary">@{handle}</p>
                                                <p className="mt-2 line-clamp-1 text-xs text-text-secondary/80">{profile.about || 'Explorando novos mundos, um anime por vez.'}</p>
                                                {genres.length > 0 && (
                                                    <div className="mt-2 flex gap-1.5">
                                                        {genres.map((genre) => (
                                                            <span key={genre} className="rounded-md border border-border-color bg-bg-tertiary px-1.5 py-0.5 text-[9px] font-bold text-text-secondary">{genre}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-text-secondary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : debouncedTerm.length >= 2 ? (
                            <div className="grid min-h-[260px] place-items-center rounded-3xl border border-dashed border-border-color bg-bg-primary/25 px-6 text-center">
                                <div>
                                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-bg-tertiary text-text-secondary">
                                        <Users className="h-6 w-6" />
                                    </span>
                                    <h3 className="mt-4 font-black text-text-primary">Nenhum perfil encontrado</h3>
                                    <p className="mt-1 text-sm text-text-secondary">Tente outro nome ou confira a escrita.</p>
                                </div>
                            </div>
                        ) : showInitialState ? (
                            <div className="relative grid min-h-[260px] place-items-center overflow-hidden rounded-3xl border border-dashed border-border-color bg-bg-primary/25 px-6 text-center">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_45%)]" />
                                <div className="relative max-w-md">
                                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                        <Sparkles className="h-6 w-6" />
                                    </span>
                                    <h3 className="mt-4 font-black text-text-primary">Quem compartilha o seu gosto?</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">Digite pelo menos duas letras para começar a explorar a comunidade.</p>
                                    <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                                        <span className="rounded-full border border-border-color bg-bg-tertiary/60 px-3 py-1.5">Perfis públicos</span>
                                        <span className="rounded-full border border-border-color bg-bg-tertiary/60 px-3 py-1.5">Resultados rápidos</span>
                                        <span className="rounded-full border border-border-color bg-bg-tertiary/60 px-3 py-1.5">100% comunidade</span>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </Modal>
    );
}