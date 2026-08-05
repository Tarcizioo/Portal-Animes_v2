import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AmbientBackdrop } from '@/components/layout/AmbientBackdrop';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { OnboardingModal } from '@/components/profile/OnboardingModal';
import { HeroAmbientProvider } from '@/context/HeroAmbientContext';
import { usePresence } from '@/hooks/usePresence';

const isImmersiveHeaderPath = (pathname) => (
    pathname === '/' || /^\/anime\/[^/]+\/?$/.test(pathname)
);

export function Layout({ children, showHeader = true, showFooter = true }) {
    const mainRef = useRef(null);
    const scrollFrameRef = useRef(null);
    const { pathname } = useLocation();
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

                <div className="app-sidebar-shell relative z-30 hidden md:flex">
                    <Sidebar />
                </div>

                <OnboardingModal />

                <main
                    ref={mainRef}
                    data-layout-main
                    className="relative z-20 flex h-full w-full flex-1 flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-surface-dark/20 hover:scrollbar-thumb-surface-dark/40"
                    onScroll={handleMainScroll}
                >
                    {showHeader ? <Header isHeroMode={hasImmersiveHeader && isHeroHeader} /> : null}

                    <div className="flex-1 pb-24 md:pb-0">
                        {children}
                    </div>

                    {showFooter ? <Footer /> : null}
                </main>

                <BottomNav />
            </div>
        </HeroAmbientProvider>
    );
}