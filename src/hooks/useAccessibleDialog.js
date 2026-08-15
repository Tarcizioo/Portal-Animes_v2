import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const dialogStack = [];
let scrollLockCount = 0;
let originalBodyOverflow = '';

function isVisible(element) {
  if (!element || element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function getFocusableElements(dialog) {
  if (!dialog) return [];
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(isVisible);
}

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = originalBodyOverflow;
}

/**
 * Adds the keyboard and focus contract expected from a portaled modal dialog.
 * The top-most registered dialog owns Escape and Tab when dialogs are nested.
 */
export function useAccessibleDialog({
  isOpen,
  onClose,
  dialogRef,
  initialFocusRef,
  lockScroll = true,
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const token = Symbol('dialog');
    const previouslyFocused = document.activeElement;
    dialogStack.push(token);
    if (lockScroll) lockBodyScroll();

    const scheduleFocus = window.requestAnimationFrame?.bind(window) || window.setTimeout.bind(window);
    const cancelFocus = window.cancelAnimationFrame?.bind(window) || window.clearTimeout.bind(window);
    const focusFrame = scheduleFocus(() => {
      const dialog = dialogRef.current;
      const requestedTarget = initialFocusRef?.current;
      const target = isVisible(requestedTarget)
        ? requestedTarget
        : getFocusableElements(dialog)[0] || dialog;
      target?.focus?.();
    });

    const handleKeyDown = (event) => {
      if (dialogStack.at(-1) !== token) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      const focusable = getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog?.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const focusIsOutside = !dialog?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelFocus(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      const stackIndex = dialogStack.lastIndexOf(token);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      if (lockScroll) unlockBodyScroll();
      if (previouslyFocused?.isConnected) previouslyFocused.focus?.();
    };
  }, [dialogRef, initialFocusRef, isOpen, lockScroll]);
}
