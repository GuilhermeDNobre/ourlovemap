import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Eyebrow } from '../ui/Eyebrow';
import { DarkMockup } from './DarkMockup';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="bg-olm-bg px-6 py-[72px] pb-[112px]">
      <div className="max-w-[1120px] mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <Eyebrow>Para vocês dois</Eyebrow>
          <h1
            className="font-serif text-olm-title mt-[22px] leading-[1.02] tracking-tight"
            style={{ fontSize: 'clamp(2.75rem, 5.5vw, 4.25rem)' }}
          >
            O mapa de tudo<br />
            que vocês <em className="text-olm-primary">viveram</em><br />
            juntos.
          </h1>
          <p className="text-[18px] leading-relaxed text-fg-2 mt-6 max-w-[480px]">
            Uma página privada com os lugares, as fotos e as mensagens da história de vocês — entregue por QR Code no seu e-mail.
          </p>
          <div className="mt-8 flex gap-3.5 flex-wrap">
            <Button size="lg" onClick={() => navigate('/criar?plano=basic')}>
              Criar nosso mapa <ArrowRight size={16} strokeWidth={1.75} />
            </Button>
            <Button variant="secondary" size="lg">
              Ver exemplo
            </Button>
          </div>
          <p className="mt-7 text-[13px] text-fg-3">
            ♥ Mais de 3.200 casais já criaram o deles
          </p>
        </div>

        <div className="flex justify-center">
          <DarkMockup size="md" />
        </div>
      </div>
    </section>
  );
}
