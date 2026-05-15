import { Check } from 'lucide-react';
import { Eyebrow } from '../ui/Eyebrow';
import { DarkMockup } from './DarkMockup';

const FEATURES = [
  'Mapa interativo com rota entre os lugares',
  'Fotos em polaroide estilo viagem',
  'Contador do relacionamento ao vivo',
  'Funciona perfeitamente no celular',
];

export function PreviewExperience() {
  return (
    <section className="bg-olm-bg px-6 py-24">
      <div className="max-w-[1120px] mx-auto grid md:grid-cols-2 gap-[72px] items-center">
        <div className="flex justify-center">
          <DarkMockup size="lg" />
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-olm-accent-100 text-olm-accent text-xs font-semibold tracking-[0.08em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-olm-accent" />
            Exclusivo
          </div>
          <h2
            className="font-serif text-olm-title mt-5 mb-4 leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}
          >
            Uma experiência que eles <em className="text-olm-primary">nunca</em> vão esquecer.
          </h2>
          <p className="text-[17px] text-fg-2 leading-relaxed mb-7">
            A pessoa escaneia o QR Code e abre uma página só de vocês — com mapa, pins animados, polaroides e o contador rodando em tempo real.
          </p>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-[15px] text-fg-2">
                <span className="w-[22px] h-[22px] rounded-full bg-olm-primary text-white inline-flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={1.75} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
