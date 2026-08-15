import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { HeroAmbientProvider } from '@/context/HeroAmbientContext';
import { usePresence } from '@/hooks/usePresence';

const isImmersiveHeaderPath = (pathname) => (
    pathname === '/' || /^\/anime\/[^/]+\/?$/.test(pathname)
);

export function Layout({ children, showHeader = true, showFooter = true }) {
    const mainRef = useRef(null);
    const scrollFrameRef = useRef(null);
    const { pathname } = useLocation();
    const isDedicatedAuthPath = pathname === '/login' || pathname === '/onboarding';
    const hasImmersiveHeader = isImmersiveHeaderPath(pathname);
    const [isHeroHeader, setIsHeroHeader] = useState(hasImmersiveHeader);
    const [ambientArtwork, setAmbientArtwork] = useState(null);

    usePresence();

    useLayoutEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }

        const frame = window.requestAnimationFrame(() => {
            setIsHeroHeader(hasImmersiveHeader);

            if (pathname !== '/') {
                setAmbientArtwork(null);
            }
        });

        return () => {
            window.cancelAnimationFrame(frame);

            if (scrollFrameRef.current) {
                window.cancelAnimationFrame(scrollFrameRef.current);
                scrollFrameRef.current = null;
            }
        };
    }, [hasImmersiveHeader, pathname]);

    const handleMainScroll = () => {
        if (!hasImmersiveHeader || !mainRef.current || scrollFrameRef.current) return;

        scrollFrameRef.current = window.requestAnimationFrame(() => {
            scrollFrameRef.current = null;
            const main = mainRef.current;
            if (!main || !isImmersiveHeaderPath(pathname)) return;

            const hero = main.querySelector('[data-header-hero]');
            const header = main.querySelector('[data-app-header]');

            if (!hero) {
                const nextValue = main.scrollTop < 80;
                setIsHeroHeader((currentValue) => currentValue === nextValue ? currentValue : nextValue);
                return;
            }

            const mainTop = main.getBoundingClientRect().top;
            const headerHeight = header?.offsetHeight || 80;
            const heroBottom = hero.getBoundingClientRect().bottom;
            const nextValue = heroBottom > mainTop + headerHeight + 24;

            setIsHeroHeader((currentValue) => currentValue === nextValue ? currentValue : nextValue);
        });
    };

    const isAmbientActive = pathname === '/' && isHeroHeader && Boolean(ambientArtwork?.src);

    return (
        <HeroAmbientProvider publish={setAmbientArtwork}>
            <div
                data-ambient-active={String(isAmbientActive)}
                className="app-shell relative isolate flex h-screen overflow-hidden bg-background-light text-text-primary font-sans dark:bg-background-dark"
            >
                <AmbientBackdrop artwork={ambientArtwork} isActive={isAmbientActive} />

                {isDedicatedAuthPath ? null : (
                    <div className="app-sidebar-shell relative z-30 hidden md:flex"><Sidebar /></div>
                )}

                <main
                    ref={mainRef}
                    data-layout-main
                    data-layout-variant={isDedicatedAuthPath ? 'auth' : 'default'}
                    className={`relative z-20 flex h-full w-full flex-1 flex-col overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-thumb-surface-dark/20 hover:scrollbar-thumb-surface-dark/40 ${isDedicatedAuthPath ? '' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0'}`}
                    onScroll={handleMainScroll}
                >
                    {showHeader && !isDedicatedAuthPath ? (
                        <Header
                            isHeroMode={hasImmersiveHeader && isHeroHeader}
                            showMobileBrand={pathname === '/'}
                            hideOnMobile={pathname === '/discover'}
                        />
                    ) : null}

                    <div className={isDedicatedAuthPath ? 'min-h-full flex-1' : 'flex-1'}>
                        {children}
                    </div>

                    {showFooter && !isDedicatedAuthPath ? <Footer /> : null}
                </main>

                {isDedicatedAuthPath ? null : <BottomNav />}
            </div>
        </HeroAmbientProvider>
    );
}
