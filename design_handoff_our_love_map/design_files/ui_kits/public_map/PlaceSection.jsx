// PlaceSection — one scrollable "stop" on the journey.
// Shows:
//   1. a dim map with only THIS place's pin lit (previous pins faded)
//   2. a content container (polaroid + title + description + location)
//   3. a discreet down-arrow hint to keep scrolling

const MiniMap = ({ places, activeIndex }) => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none"
       style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55 }}>
    <defs>
      <pattern id="mini-grid" width="6" height="6" patternUnits="userSpaceOnUse">
        <path d="M 6 0 L 0 0 0 6" fill="none" stroke="rgba(251,245,240,0.05)" strokeWidth="0.2"/>
      </pattern>
    </defs>
    <rect width="100" height="100" fill="url(#mini-grid)" />
    {/* faint path connecting prior pins up to active */}
    {activeIndex > 0 && (
      <path
        d={places.slice(0, activeIndex + 1).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
        fill="none" stroke="rgba(245,108,115,0.25)" strokeWidth="0.4" strokeDasharray="1 1.5" strokeLinecap="round"
      />
    )}
    {places.map((p, i) => {
      const isActive = i === activeIndex;
      const isPast = i < activeIndex;
      return (
        <g key={p.id} opacity={isActive ? 1 : isPast ? 0.35 : 0.08}>
          {isActive && <circle cx={p.x} cy={p.y} r="5" fill="rgba(245,108,115,0.3)">
            <animate attributeName="r" values="4;7;4" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2.2s" repeatCount="indefinite" />
          </circle>}
          <circle cx={p.x} cy={p.y} r={isActive ? "1.8" : "1.2"} fill="#F56C73" />
        </g>
      );
    })}
  </svg>
);

const PlaceSection = ({ place, index, activeIndex, total }) => {
  const isActive = index === activeIndex;
  return (
    <section style={{
      minHeight: "100vh",
      position: "relative",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "80px 22px 60px",
      overflow: "hidden",
    }}>
      <MiniMap places={journey} activeIndex={index} />

      {/* ambient glow follows active pin */}
      <div style={{
        position: "absolute",
        left: `${place.x}%`, top: `${place.y}%`,
        transform: "translate(-50%, -50%)",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,108,115,0.16), transparent 70%)",
        pointerEvents: "none",
        transition: "opacity 600ms var(--ease-standard)",
        opacity: isActive ? 1 : 0.4,
      }} />

      {/* content container */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 440,
        background: "rgba(37, 33, 42, 0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(251,245,240,0.08)",
        borderRadius: 28,
        padding: "26px 24px 30px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        opacity: isActive ? 1 : 0.35,
        transform: isActive ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
        transition: "all 500ms var(--ease-emphasized)",
      }}>
        {/* step counter */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
          color: "var(--olm-primary)", fontWeight: 600,
        }}>
          <span>Lugar {index + 1} · {total}</span>
          <span style={{ color: "var(--dfg-3)" }}>{place.date}</span>
        </div>

        {/* polaroid (one photo per place) */}
        <div style={{
          marginTop: 18,
          background: "#FBF5F0",
          borderRadius: 4,
          padding: "10px 10px 40px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          transform: "rotate(-2deg)",
          position: "relative",
          width: "82%",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          <div style={{ aspectRatio: 1, background: place.gradient, borderRadius: 2 }} />
          <div style={{
            position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center",
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: 15, color: "var(--olm-title)",
          }}>{place.name.split(",")[0].toLowerCase()}</div>
        </div>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--olm-primary)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
            {place.tag}
          </div>
          <h2 style={{
            fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--dfg-1)",
            margin: "6px 0 0", lineHeight: 1.1, letterSpacing: "-0.01em",
          }}>{place.name}</h2>
          <p style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: 17, color: "var(--dfg-2)",
            margin: "14px 0 0", lineHeight: 1.45,
          }}>"{place.note}"</p>
        </div>
      </div>

      {/* scroll hint */}
      <div style={{
        position: "absolute",
        bottom: 28, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        color: "var(--dfg-3)", fontSize: 10,
        letterSpacing: "0.18em", textTransform: "uppercase",
        opacity: isActive ? 1 : 0,
        transition: "opacity 400ms var(--ease-standard)",
      }}>
        <span>role para continuar</span>
        <svg width="18" height="22" viewBox="0 0 18 22" fill="none" style={{ animation: "bob 1.8s ease-in-out infinite" }}>
          <path d="M9 2 v16 M3 13 l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <style>{`
        @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      `}</style>
    </section>
  );
};

Object.assign(window, { PlaceSection });
