import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '../ui/Button';
import logoSrc from '../../assets/logo.svg';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Como funciona', href: '#how' },
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Preços', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('olm-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navigate = useNavigate();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (!el) return;

    clearTimeout(scrollTimer.current);
    document.documentElement.classList.add('nav-transitioning');

    el.scrollIntoView({ behavior: 'smooth' });

    scrollTimer.current = setTimeout(() => {
      document.documentElement.classList.remove('nav-transitioning');
    }, 650);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('olm-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        let best = '';
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            best = entry.target.id;
            bestRatio = entry.intersectionRatio;
          }
        }
        if (best) setActiveSection(best);
      },
      { rootMargin: '-56px 0px -75% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    const onScroll = () => {
      if (window.scrollY < 80) setActiveSection('home');
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const linkClass = (href: string) => {
    const active = activeSection === href.slice(1);
    return [
      'relative px-3 py-1.5 text-sm font-medium rounded-lg no-underline',
      'transition-colors duration-200',
      active ? 'text-olm-primary' : 'text-fg-2 hover:text-fg-1',
    ].join(' ');
  };

  return (
    <nav
      data-testid="navbar"
      className={[
        'sticky top-0 z-40 h-14',
        'transition-colors duration-200 ease-standard border-b',
        scrolled ? 'border-olm-surface' : 'border-transparent',
      ].join(' ')}
      style={{
        backgroundColor: scrolled ? 'color-mix(in srgb, var(--olm-bg) 80%, transparent)' : 'var(--olm-bg)',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
      }}
    >
      <div className="h-full max-w-[1440px] mx-auto px-6 md:px-8 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 no-underline"
          aria-label="Our Love Map"
        >
          <img src={logoSrc} alt="" width={22} height={22} />
          <span className="font-serif text-[19px] leading-none text-fg-1">
            Our Love <em className="text-olm-primary not-italic">Map</em>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => handleNavClick(e, href)}
              className={linkClass(href)}
            >
              {label}
              {activeSection === href.slice(1) && (
                <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-olm-primary" />
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-fg-3 hover:text-fg-1 transition-colors"
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            <span
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
              }`}
            >
              <Sun size={17} />
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
              }`}
            >
              <Moon size={17} />
            </span>
          </button>

          <Button
            className="hidden sm:inline-flex"
            onClick={() => navigate('/criar')}
          >
            Criar mapa
            <ArrowRight size={15} strokeWidth={1.75} />
          </Button>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-fg-3 hover:text-fg-1 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div
        className={[
          'fixed inset-0 z-50 md:hidden',
          'transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
          <div
            className="absolute inset-0 bg-olm-bg flex flex-col"
            style={{
              transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
        >
          <div className="flex items-center justify-between h-14 px-6 border-b border-olm-surface">
            <span className="font-serif text-[17px] text-fg-1">Menu</span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-fg-3 hover:text-fg-1 transition-colors"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-1 px-8 py-8">
            {NAV_LINKS.map(({ label, href }, i) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className={[
                  'text-[28px] font-serif text-fg-1 no-underline py-3',
                  'transition-colors duration-200',
                  activeSection === href.slice(1) ? 'text-olm-primary' : 'hover:text-olm-primary',
                ].join(' ')}
                style={{
                  opacity: mobileOpen ? 1 : 0,
                  filter: mobileOpen ? 'blur(0)' : 'blur(6px)',
                  transform: mobileOpen ? 'translateX(0)' : 'translateX(24px)',
                  transition: mobileOpen
                    ? `opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${180 + i * 80}ms, filter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${180 + i * 80}ms, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) ${180 + i * 80}ms, color 0.2s ease`
                    : 'opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease',
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="px-8 pb-10 pt-4">
            <Button className="w-full" onClick={() => { setMobileOpen(false); navigate('/criar'); }}>
              Criar nosso mapa
              <ArrowRight size={16} strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
