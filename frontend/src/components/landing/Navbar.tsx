import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/Button';
import logoSrc from '../../assets/logo.svg';

const NAV_LINKS = [
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
  const navigate = useNavigate();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
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

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <nav
      data-testid="navbar"
      className={[
        'sticky top-0 z-40 h-[72px] px-6 md:px-8 flex items-center justify-between',
        'transition-colors duration-200 ease-standard border-b',
        scrolled ? 'border-olm-surface' : 'border-transparent',
      ].join(' ')}
      style={{
        backgroundColor: scrolled ? 'color-mix(in srgb, var(--olm-bg) 80%, transparent)' : 'var(--olm-bg)',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
      }}
    >
      <Link
        to="/"
        className="inline-flex items-center gap-2.5 no-underline"
        aria-label="Our Love Map"
      >
        <img src={logoSrc} alt="" width={26} height={26} />
        <span className="font-serif text-[21px] text-fg-1">
          Our Love <em className="text-olm-primary">Map</em>
        </span>
      </Link>

      <div className="hidden md:flex gap-8 absolute left-1/2 -translate-x-1/2">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            onClick={(e) => handleNavClick(e, href)}
            className="font-sans text-sm font-medium text-fg-1 no-underline hover:text-olm-primary transition-colors"
          >
            {label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="relative w-9 h-9 rounded-full flex items-center justify-center text-fg-3 hover:text-olm-primary transition-colors"
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
            }`}
          >
            <Sun size={18} />
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
            }`}
          >
            <Moon size={18} />
          </span>
        </button>
        <Button onClick={() => navigate('/criar')}>
          <span className="sm:hidden">Criar mapa</span>
          <span className="hidden sm:inline">Criar nosso mapa</span>
          <ArrowRight size={16} strokeWidth={1.75} />
        </Button>
      </div>
    </nav>
  );
}
