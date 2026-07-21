import { useEffect, useId, useRef, type ReactNode } from 'react';

const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function isUsableFocusTarget(target: HTMLElement | null | undefined, container: HTMLElement) {
  if (!target || !container.contains(target) || !target.matches(focusableSelector) || target.tabIndex < 0 || target.hidden || target.getAttribute('aria-hidden') === 'true') return false;
  if (target instanceof HTMLInputElement && target.type === 'hidden') return false;
  let current: HTMLElement | null = target;
  while (current && container.contains(current)) {
    if (current.hidden || current.hasAttribute('inert') || current.getAttribute('aria-hidden') === 'true' || current instanceof HTMLFieldSetElement && current.disabled) return false;
    const style = getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (current === container) break;
    current = current.parentElement;
  }
  return true;
}

function firstFocusable(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)].find((target) => isUsableFocusTarget(target, container));
}

export function Dialog({ children, initialFocusRef, onClose, open, title }: { children: ReactNode; initialFocusRef?: React.RefObject<HTMLElement | null>; onClose: () => void; open: boolean; title: string }) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInside = () => {
      const container = containerRef.current;
      if (!container) return;
      const preferred = initialFocusRef?.current;
      const target: HTMLElement = isUsableFocusTarget(preferred, container) ? preferred! : firstFocusable(container) ?? container;
      target.focus();
    };
    focusInside();
    const containFocus = (event: FocusEvent) => {
      if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) focusInside();
    };
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('focusin', containFocus);
      restoreRef.current?.focus();
    };
  }, [initialFocusRef, open]);

  if (!open) return null;
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !containerRef.current) return;
    const focusable = [...containerRef.current.querySelectorAll<HTMLElement>(focusableSelector)].filter((target) => isUsableFocusTarget(target, containerRef.current!));
    if (!focusable.length) {
      event.preventDefault();
      containerRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <div className="dialog-backdrop">
      <div ref={containerRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={handleKeyDown}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
