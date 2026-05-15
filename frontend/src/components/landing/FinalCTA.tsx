import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section
      className="px-6 py-[112px]"
      style={{ background: 'linear-gradient(180deg, var(--olm-title), var(--olm-dark))' }}
    >
      <div className="max-w-[680px] mx-auto text-center relative">
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-olm-primary text-[18px] tracking-[0.4em]">
          ♥ ♥ ♥
        </div>
        <h2
          className="font-serif text-white mt-7 mb-5 leading-[1.02]"
          style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}
        >
          Crie o <em className="text-olm-primary">mapa do amor</em> de vocês.
        </h2>
        <p className="text-[18px] text-[rgba(251,245,240,0.7)] leading-[1.5] mx-auto mb-9 max-w-[480px]">
          Alguns minutos agora. Uma memória que vocês vão querer ver pra sempre.
        </p>
        <Button size="lg" onClick={() => navigate('/criar')}>
          Começar agora <ArrowRight size={16} strokeWidth={1.75} />
        </Button>
        <div className="mt-[18px] text-xs text-[rgba(251,245,240,0.5)] tracking-[0.08em]">
          PAGAMENTO ÚNICO · SEM ASSINATURA
        </div>
      </div>
    </section>
  );
}
