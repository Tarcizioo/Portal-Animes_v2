import { Compass, Home, Library, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

const matchesPath = (pathname, paths) => paths.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
));

export function BottomNav() {
    const { pathname } = useLocation();
    const { user } = useAuth();

    const navItems = [
        {
            icon: Home,
            label: 'Início',
            path: '/',
            isActive: pathname === '/',
        },
        {
            icon: Compass,
            label: 'Descobrir',
            path: '/discover',
            isActive: matchesPath(pathname, [
                '/discover',
                '/catalog',
                '/search',
                '/calendar',
                '/characters',
                '/character',
                '/people',
                '/person',
                '/studio',
            ]),
        },
        {
            icon: Library,
            label: 'Biblioteca',
            path: '/library',
            isActive: matchesPath(pathname, ['/library']),
        },
        {
            icon: User,
            label: user ? 'Perfil' : 'Entrar',
            path: user ? '/profile' : '/login',
            isActive: user
                ? matchesPath(pathname, ['/profile', '/stats'])
                : matchesPath(pathname, ['/login']),
        },
    ];

    return (
        <nav
            aria-label="Navegação principal"
            data-bottom-nav
            className="fixed inset-x-3 z-50 mx-auto max-w-[30rem] rounded-full border border-border-color bg-bg-primary p-1.5 shadow-[0_22px_55px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl md:hidden"
            style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
            <div className="flex h-[56px] items-stretch gap-1">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        aria-current={item.isActive ? 'page' : undefined}
                        className={clsx(
                            'group relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-full border-0 px-1 text-[10px] font-semibold transition-[color,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary active:scale-[0.97]',
                            item.isActive
                                ? 'bg-bg-tertiary text-primary hover:text-primary'
                                : 'bg-transparent text-text-secondary hover:bg-bg-tertiary/70 hover:text-text-primary',
                        )}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        <item.icon
                            aria-hidden="true"
                            strokeWidth={item.isActive ? 2.5 : 2}
                            className={clsx(
                                'relative z-10 h-5 w-5 transition-transform duration-200',
                                item.isActive ? '-translate-y-0.5 scale-105' : 'group-active:scale-90',
                            )}
                        />
                        <span className="relative z-10 leading-none">{item.label}</span>
                        {item.isActive && (
                            <span
                                aria-hidden="true"
                                className="absolute bottom-1 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
                            />
                        )}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
