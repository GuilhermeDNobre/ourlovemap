import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Copy, CreditCard, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/api';
import { usePaymentPolling } from '../../hooks/use-payment-polling';

type ModalView = 'loading' | 'pix' | 'card' | 'success' | 'error';

interface PixData {
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PaymentModal({ isOpen, onClose, mapId }: PaymentModalProps) {
  const [view, setView] = useState<ModalView>('loading');
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [taxId, setTaxId] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);

  const { data: paymentStatus } = usePaymentPolling(isOpen ? mapId : null);

  const pixMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<PixData>(`/api/maps/${mapId}/pix-payment`);
      return response.data;
    },
    onSuccess: (data) => {
      setPixData(data);
      const initialSeconds = Math.max(
        0,
        Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsLeft(initialSeconds);
      setView('pix');
    },
    onError: () => {
      setView('error');
    },
  });
  const { mutate: triggerPix } = pixMutation;

  const cardMutation = useMutation({
    mutationFn: async () => {
      const rawTaxId = taxId.replace(/\D/g, '');
      const response = await api.post<{ checkoutUrl: string }>(
        `/api/maps/${mapId}/card-payment`,
        { taxId: rawTaxId },
      );
      return response.data;
    },
    onSuccess: (data) => {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = data.checkoutUrl;
      } else {
        window.open(data.checkoutUrl, '_blank');
      }
    },
  });

  useEffect(() => {
    if (!isOpen || !mapId) return;
    setView('loading');
    setPixData(null);
    setTaxId('');
    setCopied(false);
    triggerPix();
  }, [isOpen, mapId, triggerPix]);

  useEffect(() => {
    if (paymentStatus?.status === 'active') setView('success');
    if (paymentStatus?.status === 'payment_failed') setView('error');
  }, [paymentStatus?.status]);

  useEffect(() => {
    if (view !== 'pix') return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [view]);

  const handleCopy = async () => {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    setView('loading');
    triggerPix();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="p-6">
      {view === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full bg-olm-primary/20 animate-ping" />
            <div className="absolute inset-1 rounded-full bg-olm-primary/40 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-olm-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">♥</span>
            </div>
          </div>
          <p className="text-sm text-fg-2">Gerando QR Code PIX...</p>
        </div>
      )}

      {view === 'pix' && pixData && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-olm-title text-base">Pague com PIX</h3>
          <div className="flex justify-center">
            <img
              src={pixData.brCodeBase64}
              alt="QR Code PIX"
              className="w-48 h-48 rounded-lg border border-olm-surface"
            />
          </div>
          <div className="rounded-lg border border-olm-surface bg-olm-bg p-3 flex flex-col gap-2">
            <p className="text-xs text-fg-3 font-medium">Código copia e cola</p>
            <p className="text-xs text-fg-2 break-all font-mono line-clamp-2">{pixData.brCode}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-olm-primary text-olm-primary text-sm font-medium hover:bg-olm-primary/5 transition-colors"
          >
            <Copy size={14} />
            {copied ? 'Copiado!' : 'Copiar código'}
          </button>
          {secondsLeft > 0 ? (
            <p className="text-center text-xs text-fg-3">
              QR Code expira em <span className="font-mono font-semibold">{formatTimer(secondsLeft)}</span>
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-olm-error">QR Code expirado</p>
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-xs text-olm-primary hover:underline"
              >
                <RefreshCw size={12} />
                Gerar novo QR Code
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setView('card')}
            className="flex items-center justify-center gap-2 text-sm text-fg-2 hover:text-olm-title transition-colors py-1"
          >
            <CreditCard size={14} />
            Pagar com cartão de crédito
          </button>
        </div>
      )}

      {view === 'card' && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-olm-title text-base">Pagamento com cartão</h3>
          <p className="text-sm text-fg-2">Informe seu CPF para continuar.</p>
          <Input
            label="CPF"
            value={taxId}
            onChange={(val) => setTaxId(formatCpf(val))}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
          <Button
            variant="primary"
            size="lg"
            onClick={() => cardMutation.mutate()}
            disabled={taxId.replace(/\D/g, '').length < 11 || cardMutation.isPending}
          >
            {cardMutation.isPending ? 'Redirecionando...' : 'Ir para pagamento'}
          </Button>
          <button
            type="button"
            onClick={() => setView('pix')}
            className="text-sm text-fg-3 hover:text-fg-2 transition-colors text-center"
          >
            Voltar para PIX
          </button>
        </div>
      )}

      {view === 'success' && (
        <div className="payment-success-panel flex flex-col items-center gap-4 py-6 text-center rounded-xl border border-olm-surface bg-olm-bg p-5">
          <svg
            viewBox="0 0 64 64"
            aria-hidden="true"
            className="w-14 h-14 payment-success-svg"
          >
            <circle
              cx="32"
              cy="32"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="payment-success-ring"
            />
            <path
              d="M20 33 L29 42 L45 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="payment-success-check"
            />
          </svg>
          <h3 className="payment-success-title font-semibold text-base">Pagamento confirmado!</h3>
          <p className="payment-success-copy text-sm">
            Seu QR Code está a caminho do seu email. Guarde-o com carinho.
          </p>
          <Button variant="primary" size="md" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}

      {view === 'error' && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <p className="text-sm text-olm-error font-medium">
            {pixMutation.isError
              ? 'Erro ao gerar QR Code. Tente novamente.'
              : 'Pagamento não aprovado.'}
          </p>
          <Button variant="primary" size="md" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      <style>{`
        .payment-success-panel { color: #2E2A4A; }
        .payment-success-title { color: #2E2A4A; }
        .payment-success-copy { color: #3F3A5A; }
        .payment-success-svg { color: #22c55e; }
        .payment-success-ring {
          stroke-dasharray: 151;
          stroke-dashoffset: 151;
          animation: payment-ring-draw 0.45s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .payment-success-check {
          stroke-dasharray: 34;
          stroke-dashoffset: 34;
          animation: payment-check-draw 0.32s cubic-bezier(0.4,0,0.2,1) 0.22s forwards;
        }
        @keyframes payment-ring-draw {
          from { stroke-dashoffset: 151; opacity: 0.8; transform: scale(0.92); transform-origin: center; }
          to { stroke-dashoffset: 0; opacity: 1; transform: scale(1); transform-origin: center; }
        }
        @keyframes payment-check-draw {
          from { stroke-dashoffset: 34; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        [data-theme="dark"] .payment-success-panel,
        :root:not([data-theme="light"]) .payment-success-panel {
          background: #1F1B24;
          border-color: #555063;
          color: #F5F1FA;
        }
        [data-theme="dark"] .payment-success-title,
        [data-theme="dark"] .payment-success-copy,
        :root:not([data-theme="light"]) .payment-success-title,
        :root:not([data-theme="light"]) .payment-success-copy {
          color: #F5F1FA !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .payment-success-ring,
          .payment-success-check {
            animation: none !important;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </Modal>
  );
}
