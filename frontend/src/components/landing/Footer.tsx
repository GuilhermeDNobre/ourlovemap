import logoSrc from '../../assets/logo.svg';

const LINKS = ['Termos', 'Privacidade', 'Contato', 'Instagram'];

export function Footer() {
  return (
    <footer className="bg-olm-dark px-6 pt-14 pb-8 text-[rgba(251,245,240,0.6)]">
      <div className="max-w-[1120px] mx-auto flex justify-between items-center flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="" width={26} height={26} className="brightness-0 invert" />
          <span className="font-serif text-xl text-white">
            Our Love <em className="text-olm-primary">Map</em>
          </span>
        </div>
        <div className="flex gap-7 text-[13px]">
          {LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[rgba(251,245,240,0.6)] no-underline hover:text-[rgba(251,245,240,0.9)] transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
      <div className="max-w-[1120px] mx-auto mt-10 pt-6 border-t border-[rgba(251,245,240,0.08)] text-xs text-[rgba(251,245,240,0.4)] text-center">
        © 2026 Our Love Map · Feito com ♥ pra vocês
      </div>
    </footer>
  );
}
