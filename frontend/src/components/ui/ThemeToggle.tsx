import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
type ThemeToggleTone = 'default' | 'onDark';

interface ThemeToggleProps {
  className?: string;
  tone?: ThemeToggleTone;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('olm-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

const toneClasses: Record<ThemeToggleTone, string> = {
  default: 'text-fg-3 hover:text-fg-1',
  onDark: 'text-[#FBF5F0]/75 hover:text-white border border-white/15 bg-white/10 backdrop-blur-sm',
};

export function ThemeToggle({ className = '', tone = 'default' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('olm-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={[
        'relative w-9 h-9 rounded-full flex items-center justify-center transition-colors',
        toneClasses[tone],
        className,
      ].join(' ')}
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
  );
}
