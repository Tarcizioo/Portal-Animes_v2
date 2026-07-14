import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Home, Compass, Heart, Settings, ChevronLeft, ChevronRight, LogOut, X, Users, Tv, Menu, Zap, LogIn, Library, Globe, BarChart3, User, Star } from 'lucide-react'; // [Modified]
import clsx from 'clsx';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { UserSearchModal } from '@/components/profile/UserSearchModal'; // [NEW]
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';


export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false); // [NEW]

  const { user, signOut, signInGoogle } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Compass, label: 'Catálogo', path: '/catalog' },
    { icon: Tv, label: 'Calendário', path: '/calendar' },
    { icon: Library, label: 'Minha Biblioteca', path: '/library' },
    { icon: BarChart3, label: 'Estat. Pessoais', path: '/stats' },
    { icon: Star, label: 'Personagens', path: '/characters' },
    { icon: Users, label: 'Pessoas', path: '/people' },
  ];

  // Link Base Styles
  const linkBase = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium w-full whitespace-nowrap overflow-hidden ${isCollapsed ? 'justify-center px-2' : 'text-left'}`;
  const linkActive = "bg-button-accent text-text-on-primary hover:text-text-on-primary shadow-lg shadow-button-accent/25";
  const linkInactive = "text-text-secondary hover:bg-bg-tertiary hover:text-primary transition-colors";

  // Usar APENAS dados do perfil customizado (nunca do Google Auth)
  // Enquanto o profile carrega, mostramos skeleton em vez de dados do Google
  const displayName = profile?.displayName || user?.displayName || 'Usuário';
  const photoURL = profile?.photoURL || null;

  return (
    <>
      {/* --- SETTINGS MODAL --- */}
      < SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)
      } />
      < UserSearchModal isOpen={isUserSearchOpen} onClose={() => setIsUserSearchOpen(false)} />

      {/* --- SIDEBAR CONTAINER --- */}
      <aside className={clsx(
        "relative bg-bg-secondary border-r border-border-color flex flex-col transition-all duration-300 ease-in-out will-change-[width] h-full",
        isCollapsed ? "w-20" : "w-72"
      )}>

        {/* 1. LOGO  */}
        <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} transition-all duration-300`}>
          <Link to="/" className={`flex items-center gap-1 text-2xl font-black text-primary tracking-tighter group transition-all duration-300 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-8 h-8 bg-primary/10 transition-colors rounded-full flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-primary fill-primary" />
            </div>
            {!isCollapsed && (
              <span className="text-text-primary group-hover:text-primary transition-colors whitespace-nowrap">
                Portal<span className="text-primary">Animes</span>
              </span>
            )}
          </Link>
        </div>

        {/* Botão de Toggle (Apenas Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-9 bg-bg-secondary border border-border-color rounded-full p-1 text-text-secondary hover:text-primary transition-colors shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* 2. NAVEGAÇÃO */}
        <nav className="flex-1 px-3 space-y-2 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-surface-dark/20 hover:scrollbar-thumb-surface-dark/40">
          {!isCollapsed && <div className="text-xs font-bold text-text-secondary/60 uppercase px-4 mb-2 tracking-wider">Menu</div>}

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(linkBase, isActive ? linkActive : linkInactive)}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon className="w-5 h-5 shrink-0" /> {!isCollapsed && item.label}
            </NavLink>
          ))}

          <div className="pt-4 pb-2">
            <div className="h-px bg-border-color mx-4" />
          </div>

          {!isCollapsed && <div className="text-xs font-bold text-text-secondary/60 uppercase px-4 mb-2 tracking-wider">Geral</div>}

          {/* User Search Button */}
          <button
            onClick={() => {
              setIsUserSearchOpen(true);
            }}
            title={isCollapsed ? "Explorar Usuários" : ""}
            className={clsx(linkBase, linkInactive)}
          >
            <Globe className="w-5 h-5 shrink-0" /> {!isCollapsed && "Explorar Usuários"}
          </button>

          <button
            onClick={() => {
              setIsSettingsOpen(true);
            }}
            title={isCollapsed ? "Configurações" : ""}
            className={clsx(linkBase, linkInactive)}
          >
            <Settings className="w-5 h-5 shrink-0" /> {!isCollapsed && "Configurações"}
          </button>
        </nav>

        {/* 3. PERFIL DINÂMICO */}
        <div className="p-4 border-t border-border-color bg-bg-tertiary">
          {user ? (
            /* Logado: Link para o perfil */
            <Link
              to="/profile"
              className={`flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-color shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden ${isCollapsed ? 'justify-center w-12 h-12 p-0' : ''}`}
              title={!isCollapsed ? 'Ver Perfil' : displayName}
            >
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />

              {/* Avatar / Skeleton */}
              <div className="relative z-10 shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-button-accent flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  {profileLoading ? (
                    // Skeleton shimmer enquanto o perfil carrega
                    <div className="w-full h-full bg-bg-tertiary relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  ) : photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="uppercase">{displayName.slice(0, 2)}</span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-bg-secondary rounded-full bg-green-500" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 z-10 ml-1">
                  {profileLoading ? (
                    // Skeleton de nome
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-bg-tertiary rounded relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      <div className="h-2.5 w-16 bg-bg-tertiary rounded relative overflow-hidden">
                        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                        {displayName}
                      </h4>
                      <p className="text-xs text-text-secondary truncate">
                        Visualizar perfil
                      </p>
                    </>
                  )}
                </div>
              )}

              {!isCollapsed && (
                <div
                  className="z-10 p-1.5 text-text-secondary group-hover:text-red-400 transition-colors"
                  onClick={handleLogout}
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </div>
              )}
            </Link>
          ) : (
            /* Não logado: Botão de Login */
            <button
              onClick={signInGoogle}
              className={`flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border-color shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group relative overflow-hidden w-full ${isCollapsed ? 'justify-center w-12 h-12 p-0' : ''}`}
              title={isCollapsed ? "Fazer Login" : ""}
            >
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />

              <div className="relative z-10 shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-button-accent flex items-center justify-center text-white font-bold text-sm overflow-hidden ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  <LogIn className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-bg-secondary rounded-full bg-gray-500"></span>
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 z-10 ml-1 text-left">
                  <h4 className="text-sm font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                    Visitante
                  </h4>
                  <p className="text-xs text-text-secondary truncate">
                    Entrar com Google
                  </p>
                </div>
              )}
            </button>
          )}
        </div>

      </aside>
    </>
  );
}