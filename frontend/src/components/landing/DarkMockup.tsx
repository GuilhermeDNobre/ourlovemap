type MockupSize = 'md' | 'lg';

interface DarkMockupProps {
  size?: MockupSize;
}

const MOCKUP_WIDTH_MD = 340;
const MOCKUP_WIDTH_LG = 420;
const MAP_PINS: [number, number][] = [[40, 180], [150, 140], [260, 40]];

export function DarkMockup({ size = 'md' }: DarkMockupProps) {
  const width = size === 'lg' ? MOCKUP_WIDTH_LG : MOCKUP_WIDTH_MD;

  return (
    <div
      className="rounded-[28px] overflow-hidden bg-olm-dark border border-[rgba(251,245,240,0.06)] w-full"
      style={{
        maxWidth: width,
        boxShadow: '0 40px 80px rgba(65,60,123,0.25), 0 16px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div className="h-7 bg-olm-dark-800 flex items-center gap-1.5 px-3">
        {[0, 1, 2].map((dotIndex) => (
          <span key={dotIndex} className="w-2 h-2 rounded-full bg-olm-dark-600" />
        ))}
        <span className="flex-1" />
        <span className="font-sans text-[9px] text-dfg-4 tracking-[0.1em]">
          ourlovemap.com/ana-e-lucas
        </span>
      </div>

      <div className="p-[18px] text-dfg-1">
        <div className="font-serif text-[22px] leading-tight">
          Ana <em className="text-olm-primary">e</em> Lucas
        </div>
        <div className="text-[10px] text-dfg-3 tracking-[0.1em] mt-1">
          2 ANOS · 7 MESES · 14 DIAS
        </div>

        <div
          className="relative mt-3.5 rounded-[14px] overflow-hidden"
          style={{
            height: 220,
            background: 'linear-gradient(180deg, #332E3A, #25212A)',
          }}
        >
          <svg
            viewBox="0 0 300 220"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <pattern id="mg" width="18" height="18" patternUnits="userSpaceOnUse">
                <path
                  d="M 18 0 L 0 0 0 18"
                  fill="none"
                  stroke="rgba(251,245,240,0.05)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="300" height="220" fill="url(#mg)" />
            <path
              d="M 40 180 Q 80 120, 150 140 T 260 40"
              stroke="#F56C73"
              strokeWidth="2"
              strokeDasharray="2 6"
              fill="none"
              strokeLinecap="round"
            />
            {MAP_PINS.map(([x, y]) => (
              <g key={`pin-${x}-${y}`} transform={`translate(${x - 8}, ${y - 16})`}>
                <circle cx="8" cy="8" r="12" fill="rgba(245,108,115,0.2)" />
                <path
                  d="M8 0 C13 0, 16 3, 16 8 C16 14, 8 18, 8 18 C8 18, 0 14, 0 8 C0 3, 3 0, 8 0 Z"
                  fill="#F56C73"
                />
              </g>
            ))}
          </svg>

          <div
            className="absolute top-10 right-4 bg-[#FBF5F0] p-[5px] pb-[18px] rounded-sm"
            style={{
              width: 74,
              transform: 'rotate(4deg)',
              boxShadow: '0 10px 22px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="aspect-square rounded-sm"
              style={{ background: 'linear-gradient(135deg, #FAA2A7, #BF77F6)' }}
            />
            <div className="absolute bottom-[3px] left-0 right-0 text-center font-serif italic text-[8px] text-olm-title">
              paris
            </div>
          </div>
        </div>

        <div className="mt-3.5 px-3 py-2.5 rounded-xl border border-[rgba(251,245,240,0.08)] bg-[rgba(251,245,240,0.04)]">
          <div className="text-[9px] text-olm-primary tracking-[0.12em] font-semibold uppercase">
            Primeiro encontro
          </div>
          <div className="font-serif text-base mt-0.5">Lisboa, Alfama</div>
          <div className="text-[11px] text-dfg-3 mt-[3px] italic font-serif">
            "Onde tudo começou."
          </div>
        </div>
      </div>
    </div>
  );
}
