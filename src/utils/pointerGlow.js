const reducedMotionQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

function shouldIgnorePointerGlow(event) {
  return (
    event.pointerType === 'touch'
    || reducedMotionQuery?.matches
    || document.documentElement.dataset.reducedMotion === 'true'
  );
}

export function trackPointerGlow(event) {
  if (shouldIgnorePointerGlow(event)) return;

  const element = event.currentTarget;
  const bounds = element.getBoundingClientRect();
  const scaleX = element.offsetWidth ? bounds.width / element.offsetWidth : 1;
  const scaleY = element.offsetHeight ? bounds.height / element.offsetHeight : 1;

  element.style.setProperty('--pointer-glow-x', `${Math.round((event.clientX - bounds.left) / scaleX)}px`);
  element.style.setProperty('--pointer-glow-y', `${Math.round((event.clientY - bounds.top) / scaleY)}px`);
}

export function resetPointerGlow(event) {
  event.currentTarget.style.setProperty('--pointer-glow-x', '50%');
  event.currentTarget.style.setProperty('--pointer-glow-y', '50%');
}
