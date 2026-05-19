import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import logoSrc from '../../assets/logo.svg';

const NAV_LINKS = [
  { label: 'Como funciona', href: '#how' },
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Preços', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      data-testid="navbar"
      className={[
        'sticky top-0 z-40 h-[72px] px-6 md:px-8 flex items-center justify-between',
        'transition-all duration-200 ease-standard',
        scrolled
          ? 'bg-[rgba(251,245,240,0.78)] border-b border-[rgba(65,60,123,0.08)]'
          : 'bg-olm-bg border-b border-transparent',
      ].join(' ')}
      style={{ backdropFilter: scrolled ? 'blur(14px)' : 'none' }}
    >
      <Link
        to="/"
        className="inline-flex items-center gap-2.5 no-underline"
        aria-label="Our Love Map"
      >
        <img src={logoSrc} alt="" width={26} height={26} />
        <span className="font-serif text-[21px] text-olm-title">
          Our Love <em className="text-olm-primary">Map</em>
        </span>
      </Link>

      <div className="hidden md:flex gap-8 absolute left-1/2 -translate-x-1/2">
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="font-sans text-sm font-medium text-olm-title no-underline hover:text-olm-primary transition-colors"
          >
            {label}
          </a>
        ))}
      </div>

      <Button onClick={() => navigate('/criar')}>
        <span className="sm:hidden">Criar mapa</span>
        <span className="hidden sm:inline">Criar nosso mapa</span>
        <ArrowRight size={16} strokeWidth={1.75} />
      </Button>
    </nav>
  );
}
