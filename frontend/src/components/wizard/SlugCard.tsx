import { slugify } from '../../lib/slug';

interface SlugCardProps {
  names: string;
}

export function SlugCard({ names }: SlugCardProps) {
  const slug = slugify(names);
  return (
    <div className="w-full max-w-[380px] rounded-[14px] border border-olm-surface bg-olm-bg-elevated p-4">
      <div className="text-[10px] text-fg-3 tracking-[0.1em] uppercase font-semibold mb-1">
        Seu link
      </div>
      <div className="font-mono text-[13px] text-olm-title font-semibold break-all">
        ourlovemap.com.br/<span className="text-olm-primary">{slug}</span>
      </div>
      <div className="text-[11px] text-fg-3 mt-1.5">
        Acesso protegido por token — só quem tem o QR Code consegue abrir.
      </div>
    </div>
  );
}
