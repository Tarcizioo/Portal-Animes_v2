import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Compass,
  Globe,
  Home,
  Library,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  Tv,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { PortalCatMark } from '@/components/brand/PortalAnimesLogo';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { UserSearchModal } from '@/components/profile/UserSearchModal';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { resetPointerGlow, trackPointerGlow } from '@/utils/pointerGlow';

const SIDEBAR_ID = 'portal-sidebar';
const NAV_ITEMS = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Compass, label: 'Catálogo', path: '/catalog' },
  { icon: Tv, label: 'Calendário', path: '/calendar' },
  { icon: Library, label: 'Minha Biblioteca', path: '/library' },
  { icon: BarChart3, label: 'Estat. Pessoais', path: '/stats' },
  { icon: Star, label: 'Personagens', path: '/characters' },
  { icon: Users, label: 'Pessoas', path: '/people' },
];
const LINK_BASE = 'app-sidebar__nav-item pointer-glow pointer-glow--nav relative flex h-12 w-full items-center overflow-hidden rounded-xl font-medium whitespace-nowrap transition-colors duration-200';
const LINK_ACTIVE = 'bg-button-accent text-text-on-primary hover:text-text-on-primary shadow-lg shadow-button-accent/25';
const LINK_INACTIVE = 'text-text-secondary hover:bg-bg-tertiary hover:text-primary';

function SidebarIcon({ children }) {
  return (
    <span aria-hidden="true" className="app-sidebar__icon-slot grid h-full w-14 shrink-0 place-items-center">
      {children}
    </span>
  );
}

function SidebarLabel({ children, isCollapsed }) {
  return <span aria-hidden={isCollapsed} className="app-sidebar__label min-w-0 truncate pr-3">{children}</span>;
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleLogout = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const displayName = profile?.displayName || user?.displayName || 'Usuário';
  const photoURL = profile?.photoURL || null;

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UserSearchModal isOpen={isUserSearchOpen} onClose={() => setIsUserSearchOpen(false)} />

      <aside
        id={SIDEBAR_ID}
        aria-label="Navegação principal"
        data-app-sidebar
        data-collapsed={String(isCollapsed)}
        data-state={isCollapsed ? 'collapsed' : 'expanded'}
        className={clsx('app-sidebar relative flex h-full shrink-0 flex-col overflow-hidden', isCollapsed ? 'w-20' : 'w-[17rem]')}
      >
        <header className="app-sidebar__brand relative flex h-16 shrink-0 items-center px-3">
          <Link
            to="/"
            aria-label="PortalAnimes — Início"
            aria-hidden={isCollapsed}
            tabIndex={isCollapsed ? -1 : undefined}
            className={clsx(
              'app-sidebar__home-link group pointer-glow pointer-glow--brand relative flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-2xl bg-primary text-text-on-primary shadow-lg shadow-primary/20 transition-[opacity,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:text-text-on-primary hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary',
              isCollapsed && 'pointer-events-none opacity-0',
            )}
            onPointerMove={trackPointerGlow}
            onPointerLeave={resetPointerGlow}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <span className="absolute inset-y-0 -left-10 w-8 rotate-12 bg-white/15 blur-sm transition-transform duration-700 group-hover:translate-x-80" />
            </span>
            <span data-sidebar-brand-mark className="app-sidebar__icon-slot relative z-10 grid h-full w-14 shrink-0 place-items-center">
              <PortalCatMark className="h-9 w-9" />
            </span>
            <span className="app-sidebar__wordmark relative z-10 min-w-0 whitespace-nowrap pr-12 text-[1rem] font-black tracking-[-0.055em]">PortalAnimes</span>
          </Link>

          <button
            type="button"
            data-sidebar-toggle
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!isCollapsed}
            aria-controls={SIDEBAR_ID}
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            onClick={() => setIsCollapsed((current) => !current)}
            onPointerMove={trackPointerGlow}
            onPointerLeave={resetPointerGlow}
            className={clsx(
              'app-sidebar__toggle pointer-glow pointer-glow--nav group absolute top-2.5 z-20 grid h-11 w-11 place-items-center overflow-hidden rounded-xl text-text-secondary shadow-sm transition-[left,right,color,background-color,box-shadow] duration-200 hover:bg-bg-tertiary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isCollapsed ? 'left-[1.125rem]' : 'right-[1.125rem] bg-bg-secondary/90',
            )}
          >
            <span data-sidebar-toggle-mark aria-hidden="true" className="app-sidebar__toggle-mark absolute inset-0 grid place-items-center text-text-on-primary">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <PortalCatMark className="h-9 w-9" />
              </span>
            </span>
            <PanelLeftOpen data-sidebar-expand-icon aria-hidden="true" className="app-sidebar__toggle-expand absolute h-5 w-5" />
            <PanelLeftClose aria-hidden="true" className="app-sidebar__toggle-collapse absolute h-5 w-5" />
          </button>
        </header>

        <nav aria-label="Seções do portal" className="app-sidebar__nav flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-surface-dark/20 hover:scrollbar-thumb-surface-dark/40">
          <div className="app-sidebar__section-heading flex h-5 shrink-0 items-center px-4 text-xs font-bold uppercase tracking-wider text-text-secondary/60">
            <span aria-hidden={isCollapsed} className="app-sidebar__section-copy">Menu</span>
          </div>

          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              data-sidebar-nav-item
              className={({ isActive }) => clsx(LINK_BASE, isActive ? LINK_ACTIVE : LINK_INACTIVE)}
              title={isCollapsed ? item.label : undefined}
              onPointerMove={trackPointerGlow}
              onPointerLeave={resetPointerGlow}
            >
              <SidebarIcon><item.icon data-sidebar-nav-icon className="h-5 w-5 shrink-0" /></SidebarIcon>
              <SidebarLabel isCollapsed={isCollapsed}>{item.label}</SidebarLabel>
            </NavLink>
          ))}

          <div aria-hidden="true" className="app-sidebar__separator shrink-0 px-4 py-2"><div className="h-px bg-border-color" /></div>

          <div className="app-sidebar__section-heading flex h-5 shrink-0 items-center px-4 text-xs font-bold uppercase tracking-wider text-text-secondary/60">
            <span aria-hidden={isCollapsed} className="app-sidebar__section-copy">Geral</span>
          </div>

          <button
            type="button"
            aria-label="Explorar usuários"
            onClick={() => setIsUserSearchOpen(true)}
            title={isCollapsed ? 'Explorar usuários' : undefined}
            className={clsx(LINK_BASE, LINK_INACTIVE, 'app-sidebar__utility')}
            onPointerMove={trackPointerGlow}
            onPointerLeave={resetPointerGlow}
          >
            <SidebarIcon><Globe data-sidebar-nav-icon className="h-5 w-5 shrink-0" /></SidebarIcon>
            <SidebarLabel isCollapsed={isCollapsed}>Explorar usuários</SidebarLabel>
          </button>

          <button
            type="button"
            aria-label="Configurações"
            onClick={() => setIsSettingsOpen(true)}
            title={isCollapsed ? 'Configurações' : undefined}
            className={clsx(LINK_BASE, LINK_INACTIVE, 'app-sidebar__utility')}
            onPointerMove={trackPointerGlow}
            onPointerLeave={resetPointerGlow}
          >
            <SidebarIcon><Settings data-sidebar-nav-icon className="h-5 w-5 shrink-0" /></SidebarIcon>
            <SidebarLabel isCollapsed={isCollapsed}>Configurações</SidebarLabel>
          </button>
        </nav>

        <footer className="app-sidebar__profile shrink-0 border-t border-border-color bg-bg-tertiary px-3 py-4">
          {user ? (
            <div className="app-sidebar__profile-row group relative flex h-16 w-full items-center overflow-hidden rounded-xl bg-bg-secondary shadow-sm transition-[background-color,box-shadow] hover:shadow-md">
              <Link
                to="/profile"
                data-sidebar-profile-anchor
                aria-label={'Ver perfil de ' + displayName}
                title={isCollapsed ? displayName : undefined}
                className="relative z-10 flex h-full min-w-0 flex-1 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SidebarIcon>
                  <span className="relative block h-10 w-10 shrink-0">
                    <span data-sidebar-avatar className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-primary to-button-accent text-sm font-bold text-white ring-2 ring-transparent transition-[box-shadow] group-hover:ring-primary/20">
                      {profileLoading ? (
                        <span className="relative h-full w-full overflow-hidden bg-bg-tertiary">
                          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </span>
                      ) : photoURL ? (
                        <img src={photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="uppercase">{displayName.slice(0, 2)}</span>
                      )}
                    </span>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg-secondary bg-green-500" />
                  </span>
                </SidebarIcon>

                <span className="app-sidebar__profile-copy min-w-0 flex-1 pr-12 text-left">
                  {profileLoading ? (
                    <span className="block space-y-1.5">
                      <span className="relative block h-3 w-24 overflow-hidden rounded bg-bg-tertiary" />
                      <span className="relative block h-2.5 w-16 overflow-hidden rounded bg-bg-tertiary" />
                    </span>
                  ) : (
                    <>
                      <span className="block truncate text-sm font-bold text-text-primary transition-colors group-hover:text-primary">{displayName}</span>
                      <span className="block truncate text-xs text-text-secondary">Visualizar perfil</span>
                    </>
                  )}
                </span>
              </Link>

              <button
                type="button"
                aria-label="Sair"
                aria-hidden={isCollapsed}
                tabIndex={isCollapsed ? -1 : 0}
                onClick={handleLogout}
                className="app-sidebar__logout absolute right-2 z-20 grid h-10 w-10 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-sidebar-profile-anchor
              aria-label="Entrar ou criar conta"
              onClick={() => navigate('/login')}
              title={isCollapsed ? 'Fazer login' : undefined}
              className="app-sidebar__profile-row group relative flex h-16 w-full items-center overflow-hidden rounded-xl bg-bg-secondary text-left shadow-sm transition-[background-color,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SidebarIcon>
                <span className="relative block h-10 w-10 shrink-0">
                  <span data-sidebar-avatar className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-primary to-button-accent text-sm font-bold text-white ring-2 ring-transparent transition-[box-shadow] group-hover:ring-primary/20">
                    <LogIn className="h-5 w-5" />
                  </span>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg-secondary bg-gray-500" />
                </span>
              </SidebarIcon>
              <span className="app-sidebar__profile-copy min-w-0 flex-1 pr-3">
                <span className="block truncate text-sm font-bold text-text-primary transition-colors group-hover:text-primary">Visitante</span>
                <span className="block truncate text-xs text-text-secondary">Entrar ou criar conta</span>
              </span>
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}