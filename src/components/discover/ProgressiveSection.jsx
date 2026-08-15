import { useEffect, useRef, useState } from 'react';

export function ProgressiveSection({ children, minHeight = 320 }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (isVisible || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setIsVisible(true);
      observer.disconnect();
    }, { rootMargin: '320px 0px' });

    const container = containerRef.current;
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div ref={containerRef} style={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? children : <div className="h-56 animate-pulse rounded-3xl border border-border-color bg-bg-secondary/55" aria-hidden="true" />}
    </div>
  );
}
