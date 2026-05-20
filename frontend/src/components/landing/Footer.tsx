import logoSrc from "../../assets/logo.svg";

const LINKS = [
  { label: "Contato", href: "mailto:support@ourlovemap.com" },
  { label: "Instagram", href: "https://instagram.com/ourlovemap" },
];

export function Footer() {
  return (
    <footer className="bg-olm-dark px-6 pt-14 pb-8 text-dfg-3">
      <div className="max-w-[1120px] mx-auto flex justify-between items-center flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt=""
            width={26}
            height={26}
            className="brightness-0 invert"
          />
          <span className="font-serif text-xl text-dfg-1">
            Our Love <em className="text-olm-primary">Map</em>
          </span>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px]">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-dfg-3 no-underline hover:text-dfg-1 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="max-w-[1120px] mx-auto mt-10 pt-4 text-xs text-dfg-4 text-center">
        © 2026 Our Love Map · Feito com ♥ pra vocês
      </div>
    </footer>
  );
}
