import { useEffect, useRef } from 'react';

const THRESHOLD = 0.12;
const ROOT_MARGIN = '0px 0px -40px 0px';
const STAGGER_BASE_MS = 70;
const STAGGER_INCREMENT_MS = 60;
const MAX_STAGGER = 8;

const LEGACY_SEL = '.olm-reveal,.olm-reveal-fade,.olm-reveal-scale,.olm-stagger > *';
const SCROLL_SEL = '[data-scroll],[data-scroll-group]';

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      root.querySelectorAll(`${LEGACY_SEL},${SCROLL_SEL}`).forEach((el) => {
        const html = el as HTMLElement;
        html.style.opacity = '1';
        html.style.animation = 'none';
        html.classList.add('is-visible');
      });
      return;
    }

    const legacyTargets = root.querySelectorAll(LEGACY_SEL);
    const scrollTargets = root.querySelectorAll(SCROLL_SEL);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;

          if (el.hasAttribute('data-scroll') || el.hasAttribute('data-scroll-group')) {
            el.classList.add('is-visible');
          }

          const parent = el.parentElement;
          const isStaggerChild = parent?.classList.contains('olm-stagger');
          if (isStaggerChild && parent) {
            const siblings = Array.from(parent.children);
            const index = siblings.indexOf(el);
            el.style.animationDelay = `${STAGGER_BASE_MS + Math.min(index, MAX_STAGGER) * STAGGER_INCREMENT_MS}ms`;
          }

          observer.unobserve(el);
        });
      },
      { threshold: THRESHOLD, rootMargin: ROOT_MARGIN },
    );

    legacyTargets.forEach((t) => observer.observe(t));
    scrollTargets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return ref;
}
