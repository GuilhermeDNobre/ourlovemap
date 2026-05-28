import { Heart } from "lucide-react";
import logoSrc from "../../assets/logo.svg";

export function Footer() {
  return (
    <footer className="bg-olm-dark pt-16 pb-10 text-dfg-3">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        <div className="grid sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={logoSrc}
                alt=""
                width={22}
                height={22}
                className="brightness-0 invert"
              />
              <span className="font-serif text-xl text-dfg-1">
                Our Love <em className="text-olm-primary">Map</em>
              </span>
            </div>
            <p className="text-[13px] text-dfg-4 leading-relaxed max-w-[260px]">
              O mapa digital do amor de vocês. Lugares, fotos e mensagens em
              uma página privada com QR Code.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-dfg-4 mb-4">
              Produto
            </div>
            <div className="flex flex-col gap-2.5">
              <a
                href="#home"
                className="text-[13px] text-dfg-3 no-underline hover:text-dfg-1 transition-colors"
              >
                Home
              </a>
              <a
                href="#how"
                className="text-[13px] text-dfg-3 no-underline hover:text-dfg-1 transition-colors"
              >
                Como funciona
              </a>
              <a
                href="#pricing"
                className="text-[13px] text-dfg-3 no-underline hover:text-dfg-1 transition-colors"
              >
                Preços
              </a>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-dfg-4 mb-4">
              Contato
            </div>
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:support@ourlovemap.com"
                className="text-[13px] text-dfg-3 no-underline hover:text-dfg-1 transition-colors"
              >
                support@ourlovemap.com
              </a>
              <a
                href="https://instagram.com/ourlovemap"
                className="text-[13px] text-dfg-3 no-underline hover:text-dfg-1 transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-4 text-xs text-dfg-4 border-t border-olm-dark-700 text-center">
          © 2026 Our Love Map · Feito com{" "}
          <Heart
            size={10}
            fill="currentColor"
            stroke="none"
            className="inline mx-0.5"
          />{" "}
          pra vocês
        </div>
      </div>
    </footer>
  );
}
