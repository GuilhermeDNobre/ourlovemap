// TravelTransition — animated decorative route between two places.
// Three path variants (variant 0/1/2) so consecutive transitions feel
// distinct: a sinuous S, a loopy spiral, and a switch-back zigzag.
// The section is shorter (90vh) than before so the journey feels tighter.

const ROUTE_VARIANTS = [
  // 0 — gentle S-curve
  "M 60 30 C 80 110, 320 90, 320 200 C 320 290, 60 270, 60 360 C 60 430, 340 420, 340 480",
  // 1 — loopy spiral
  "M 200 30 C 80 60, 60 200, 200 220 C 320 240, 340 100, 240 90 C 140 80, 100 220, 200 320 C 300 420, 80 440, 200 480",
  // 2 — zigzag switch-back
  "M 60 40 L 320 90 L 80 170 L 320 240 L 80 320 L 320 400 L 140 480",
];

const TravelTransition = ({ fromName, toName, variant = 0 }) => {
  const wrapRef = React.useRef(null);
  const pathRef = React.useRef(null);
  const [progress, setProgress] = React.useState(0);
  const [len, setLen] = React.useState(1200);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });

  const d = ROUTE_VARIANTS[variant % ROUTE_VARIANTS.length];

  React.useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [d]);

  React.useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const scrolled = Math.max(0, vh - rect.top);
      const p = Math.min(1, Math.max(0, scrolled / total));
      setProgress(p);
      if (pathRef.current) {
        const point = pathRef.current.getPointAtLength(p * len);
        setPos({ x: point.x, y: point.y });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [len]);

  return (
    <section ref={wrapRef} style={{
      minHeight: "90vh", position: "relative", overflow: "hidden",
      background: "var(--olm-dark)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* subtle grid */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.35 }}>
        <defs>
          <pattern id={`tg-${variant}-${fromName}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(251,245,240,0.05)" strokeWidth="0.15"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#tg-${variant}-${fromName})`}/>
      </svg>

      <svg viewBox="0 0 400 510" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* ghost path */}
        <path d={d} fill="none" stroke="rgba(251,245,240,0.08)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        {/* revealed path */}
        <path
          ref={pathRef}
          d={d}
          fill="none" stroke="#F56C73" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - progress)}
          style={{ filter: "drop-shadow(0 0 12px rgba(245,108,115,0.6))" }}
        />
        {/* start pin */}
        <g transform={`translate(${pathRef.current ? pathRef.current.getPointAtLength(0).x : 60}, ${pathRef.current ? pathRef.current.getPointAtLength(0).y : 30})`}>
          <circle r="9" fill="rgba(245,108,115,0.25)"/>
          <circle r="4" fill="#F56C73"/>
        </g>
        {/* moving traveller dot */}
        <g transform={`translate(${pos.x}, ${pos.y})`}>
          <circle r="10" fill="rgba(245,108,115,0.25)"/>
          <circle r="6" fill="#FBF5F0" stroke="#F56C73" strokeWidth="2"/>
        </g>
      </svg>

      {/* label */}
      <div style={{
        position: "relative", textAlign: "center",
        fontFamily: "var(--font-serif)", color: "var(--dfg-2)",
        fontStyle: "italic", fontSize: 19,
        padding: "0 32px",
        opacity: 0.4 + progress * 0.6,
      }}>
        de <span style={{ color: "var(--dfg-1)" }}>{fromName}</span>
        <div style={{ fontStyle: "normal", fontFamily: "var(--font-sans)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--olm-primary)", fontWeight: 600, margin: "10px 0" }}>pra</div>
        <span style={{ color: "var(--dfg-1)" }}>{toName}</span>
      </div>
    </section>
  );
};

Object.assign(window, { TravelTransition });
