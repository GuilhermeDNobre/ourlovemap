import { Link } from 'react-router-dom';
import { ArrowRight, FolderOpen, Heart, Mail } from 'lucide-react';
import { LogoMark } from '../components/ui/LogoMark';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const SUPPORT_EMAIL = 'support@ourlovemap.com';

const NEXT_STEPS = [
  {
    icon: Mail,
    title: 'Abra sua caixa de entrada',
    body: 'O QR Code e o link de edição chegam em até 5 minutos.',
  },
  {
    icon: FolderOpen,
    title: 'Confira o spam',
    body: 'Alguns provedores movem o primeiro email para lá.',
  },
  {
    icon: Heart,
    title: 'Fale com a gente',
    body: 'Se nada chegar, cuidamos disso manualmente.',
  },
];

export default function PaymentConfirmedPage() {
  return (
    <div data-testid="payment-confirmed-page" className="pc-page min-h-screen flex flex-col">
      <header className="pc-header h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between border-b">
        <Link to="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="Our Love Map">
          <LogoMark size={26} />
          <span className="pc-brand font-serif text-[21px]">
            Our Love <em>Map</em>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-8 py-10 md:py-14">
        <section className="pc-container mx-auto grid w-full grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:items-start">
          <div className="pt-2 text-center md:pt-8 lg:text-left">
            <div className="pc-check-wrap mx-auto mb-6 lg:mx-0">
              <svg viewBox="0 0 48 48" className="pc-check" aria-hidden="true">
                <circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" strokeWidth="2" className="pc-check-ring" />
                <path d="M16 24.5 L21.5 30 L32 18.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="pc-check-mark" />
              </svg>
            </div>

            <p className="pc-kicker mb-3 text-xs font-semibold uppercase">
              Pedido confirmado
            </p>
            <h1 className="pc-title mb-4 font-serif text-[40px] leading-[1.08] sm:text-[48px] md:text-[56px]">
              O mapa de vocês está a caminho.
            </h1>
            <p className="pc-copy max-w-[560px] text-[17px] leading-[1.65]">
              Estamos preparando o QR Code e o link de edição com os detalhes do pedido.
              O presente chega no seu email em alguns minutos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="pc-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold no-underline">
                Ir para o início <ArrowRight size={15} />
              </Link>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="pc-support inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold no-underline">
                Contatar suporte
              </a>
            </div>
          </div>

          <aside className="pc-steps border-l pl-5 sm:pl-6">
            <h2 className="pc-side-title mb-2 font-serif text-[28px] leading-[1.12]">
              Enquanto isso
            </h2>
            <p className="pc-muted mb-5 text-sm leading-[1.6]">
              Um resumo breve para você não perder o acesso ao mapa.
            </p>

            <div className="flex flex-col gap-3">
              {NEXT_STEPS.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="pc-step rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <div className="pc-step-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="pc-step-num text-[11px] font-semibold">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <p className="pc-step-title text-[15px] font-semibold leading-[1.35]">
                            {step.title}
                          </p>
                        </div>
                        <p className="pc-muted text-sm leading-[1.55]">
                          {step.body}
                        </p>
                        {index === 2 && (
                          <a href={`mailto:${SUPPORT_EMAIL}`} className="pc-link mt-2 inline-block text-sm font-semibold">
                            {SUPPORT_EMAIL}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </main>

      <style>{`
        .pc-page {
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--olm-primary) 8%, var(--olm-bg)) 0%, var(--olm-bg) 360px),
            var(--olm-bg);
        }
        .pc-header { border-color: color-mix(in srgb, var(--olm-surface) 76%, transparent); }
        .pc-container {
          max-width: 980px;
        }
        .pc-brand { color: var(--fg-1); }
        .pc-brand em,
        .pc-kicker,
        .pc-link { color: var(--olm-primary); }
        .pc-title,
        .pc-side-title,
        .pc-step-title { color: var(--fg-1); }
        .pc-copy { color: var(--fg-2); }
        .pc-muted { color: var(--fg-3); }
        .pc-primary {
          background: var(--olm-primary);
          color: #fff;
          box-shadow: 0 10px 24px rgba(245,108,115,0.24);
        }
        .pc-support {
          border: 1px solid var(--olm-surface);
          color: var(--fg-1);
          background: var(--olm-bg-elevated);
        }
        .pc-steps { border-color: var(--olm-surface); }
        .pc-step {
          background: var(--olm-bg-elevated);
          border-color: var(--olm-surface);
        }
        .pc-step-icon {
          background: var(--olm-primary-100);
          color: var(--olm-primary);
        }
        .pc-step-num { color: var(--fg-4); }
        .pc-check-wrap {
          width: 76px;
          height: 76px;
          color: var(--olm-success);
        }
        .pc-check {
          width: 100%;
          height: 100%;
          display: block;
        }
        .pc-check-ring {
          stroke-dasharray: 107;
          stroke-dashoffset: 107;
          animation: pc-ring 280ms cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .pc-check-mark {
          stroke-dasharray: 23;
          stroke-dashoffset: 23;
          animation: pc-mark 240ms cubic-bezier(0.4,0,0.2,1) 160ms forwards;
        }
        @keyframes pc-ring { to { stroke-dashoffset: 0; } }
        @keyframes pc-mark { to { stroke-dashoffset: 0; } }

        [data-theme="dark"] .pc-page,
        :root:not([data-theme="light"]) .pc-page {
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--olm-primary) 10%, var(--olm-bg)) 0%, var(--olm-bg) 360px),
            var(--olm-bg);
        }
        [data-theme="dark"] .pc-primary,
        :root:not([data-theme="light"]) .pc-primary {
          color: #1C1820;
        }
        [data-theme="dark"] .pc-muted,
        :root:not([data-theme="light"]) .pc-muted {
          color: var(--fg-2);
        }

        @media (prefers-reduced-motion: reduce) {
          .pc-check-ring,
          .pc-check-mark {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
