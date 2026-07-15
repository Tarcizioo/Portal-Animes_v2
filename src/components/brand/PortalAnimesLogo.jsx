import { useId } from 'react';
import clsx from 'clsx';

export function PortalCatMark({ className, title }) {
  const maskId = 'portal-cat-' + useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="white" />
          <ellipse cx="23" cy="39" rx="8.25" ry="10.75" fill="black" />
          <ellipse cx="41.5" cy="39" rx="8.25" ry="10.75" fill="black" />
        </mask>
      </defs>

      <path
        fill="currentColor"
        mask={'url(#' + maskId + ')'}
        d="M8.5 42.5c0-7.8 1.9-14.3 5.6-19.2l.2-13.6c0-3.5 3.7-5.3 6.4-3.1l8.5 7c1.9 1.6 4.6 1.7 6.6.3l7.1-5c2.5-1.8 5.9-.7 7.1 2.1l3.1 7.4c1.1 2.7-.6 5.6-3.5 6l-2.1.3c5 4.6 7.9 10.5 7.9 17.8 0 10.7-8.5 16-23.5 16s-23.5-5.3-23.5-16Z"
      />
      <ellipse cx="24.1" cy="40" rx="2.2" ry="3.2" fill="currentColor" />
      <ellipse cx="40.4" cy="40" rx="2.2" ry="3.2" fill="currentColor" />
      <path
        d="M6.5 38.5H2.8M7 45l-3.5 1.4m54-7.9h3.7M57 45l3.5 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PortalAnimesLogo({ compact = false, className, markClassName, wordmarkClassName }) {
  return (
    <span className={clsx('inline-flex items-center', className)}>
      <PortalCatMark className={clsx('shrink-0', markClassName)} />
      {!compact && (
        <span className={clsx('whitespace-nowrap font-black tracking-[-0.055em]', wordmarkClassName)}>
          PortalAnimes
        </span>
      )}
    </span>
  );
}
