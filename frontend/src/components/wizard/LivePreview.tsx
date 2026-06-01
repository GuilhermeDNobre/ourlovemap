import { CoupleNames } from '../ui/CoupleNames';
import { useRelationshipCounter } from '../../hooks/use-relationship-counter';
import { useWizardStore } from '../../stores/wizard-store';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function LivePreview() {
  const { names, opening, startDate, places, music, step } = useWizardStore();
  const counter = useRelationshipCounter(startDate);
  const firstPlace = places[0] ?? null;
  const hasMusic = step >= 3 && music.videoId;
  return (
    <div className="rounded-[22px] border border-olm-surface bg-[color-mix(in_srgb,var(--olm-bg-elevated)_90%,transparent)] p-4 md:p-5 shadow-[var(--sh-md)]">
      <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-fg-3 mb-3">
        Prévia ao vivo
      </div>
      <div
        className="rounded-[28px] overflow-hidden bg-olm-dark border border-[rgba(251,245,240,0.08)] mx-auto"
        style={{
          width: 'min(100%, 280px)',
          aspectRatio: '9/16',
          boxShadow: '0 24px 48px rgba(65,60,123,0.25)',
        }}
      >
        <div className="h-full flex flex-col p-5 text-dfg-1 overflow-hidden">
          <div className="font-serif text-[10px] text-[rgba(251,245,240,0.45)] tracking-[0.15em] uppercase mb-2">
            ourlovemap
          </div>
          <div className="font-serif text-[16px] leading-tight">
            {names ? <CoupleNames names={names} /> : (
              <span className="text-[rgba(251,245,240,0.35)]">Nomes do casal</span>
            )}
          </div>
          {opening && (
            <div className="font-serif italic text-[11px] text-dfg-3 mt-2 leading-[1.45] line-clamp-2">
              "{opening}"
            </div>
          )}
          {startDate ? (
            <div className="mt-3">
              <div className="text-[11px] text-dfg-3 leading-[1.6]">
                {counter.years > 0 && <span>{counter.years} anos · </span>}
                {counter.months > 0 && <span>{counter.months} meses · </span>}
                {counter.days > 0 && <span>{counter.days} dias</span>}
              </div>
              <div className="font-mono text-[10px] text-dfg-4">
                {pad(counter.hours)}:{pad(counter.minutes)}:{pad(counter.seconds)}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-[10px] text-[rgba(251,245,240,0.25)]">
              00 anos · 00 meses · 00 dias
            </div>
          )}
          {step >= 2 && firstPlace && (
            <div
              className="mt-4 rounded-[10px] p-2 pb-3 bg-[#FBF5F0] self-end"
              style={{
                width: 70,
                transform: 'rotate(3deg)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <div
                className="aspect-square rounded-sm"
                style={{ background: 'linear-gradient(135deg,#FAA2A7,#BF77F6)' }}
              />
              <div className="text-center font-serif italic text-[7px] text-olm-title mt-1 truncate">
                {firstPlace.title || 'Lugar 1'}
              </div>
            </div>
          )}
          {hasMusic && (
            <div className="mt-auto flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[rgba(251,245,240,0.1)] self-start">
              <div className="w-2 h-2 rounded-full bg-olm-primary" />
              <span className="text-[9px] text-dfg-3 truncate max-w-[145px]">
                {music.query || 'Música'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
