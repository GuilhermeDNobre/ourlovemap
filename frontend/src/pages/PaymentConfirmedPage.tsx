import { Link } from 'react-router-dom';
import { CheckCircle, Mail, FolderOpen, LifeBuoy } from 'lucide-react';
import logoSrc from '../assets/logo.svg';

const SUPPORT_EMAIL = 'support@ourlovemap.com';

export default function PaymentConfirmedPage() {
  return (
    <div data-testid="payment-confirmed-page" className="min-h-screen bg-olm-bg flex flex-col">
      <header className="h-[72px] px-6 md:px-8 flex items-center border-b border-[rgba(65,60,123,0.06)]">
        <Link to="/" className="inline-flex items-center gap-2.5 no-underline" aria-label="Our Love Map">
          <img src={logoSrc} alt="" width={26} height={26} />
          <span className="font-serif text-[21px] text-olm-title">
            Our Love <em className="text-olm-primary">Map</em>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-[420px] w-full text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-7"
            style={{
              background: 'linear-gradient(135deg, #dcfce7, #f0fdf4)',
              boxShadow: '0 0 0 8px rgba(34,197,94,0.08)',
              animation: 'pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <CheckCircle size={52} strokeWidth={1.5} className="text-green-500" />
          </div>

          <h1 className="font-serif text-[2rem] leading-tight text-olm-title mb-3">
            Pagamento confirmado!
          </h1>
          <p className="text-[17px] text-fg-2 leading-relaxed mb-8">
            Seu QR Code está a caminho. Veja as instruções abaixo.
          </p>

          <div className="bg-white rounded-2xl border border-olm-surface shadow-sm p-6 text-left flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-olm-bg flex items-center justify-center shrink-0 mt-0.5">
                <Mail size={16} className="text-olm-primary" />
              </div>
              <p className="text-sm text-fg-2 leading-relaxed">
                Verifique sua <span className="font-medium text-olm-title">caixa de entrada</span> — o email com o QR Code chegará em até 5 minutos.
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-olm-bg flex items-center justify-center shrink-0 mt-0.5">
                <FolderOpen size={16} className="text-olm-primary" />
              </div>
              <p className="text-sm text-fg-2 leading-relaxed">
                Confira também a <span className="font-medium text-olm-title">caixa de spam</span> — às vezes o email acaba por lá.
              </p>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-olm-surface">
              <div className="w-8 h-8 rounded-lg bg-olm-bg flex items-center justify-center shrink-0 mt-0.5">
                <LifeBuoy size={16} className="text-fg-3" />
              </div>
              <p className="text-sm text-fg-2 leading-relaxed">
                Ainda não chegou? Envie um email para{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-olm-primary font-medium hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>{' '}
                para relatar o problema.
              </p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
