// FinalMap — the closing screen: a real-feeling map with every place pinned,
// each marked with the polaroid that was uploaded for it. Headline + Instagram share CTA.

const FinalMap = () => {
  const shareIG = () => {
    // placeholder for real sharing — deep-link to IG stories in prod
    alert("Abrindo Instagram Stories…");
  };

  return (
    <section style={{
      minHeight: "100vh",
      position: "relative",
      padding: "80px 22px 80px",
      background: "linear-gradient(180deg, #25212A 0%, #332E3A 100%)",
      color: "var(--dfg-1)",
      overflow: "hidden",
    }}>
      {/* glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(191,119,246,0.18), transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* headline */}
      <div style={{ position: "relative", textAlign: "center", maxWidth: 520, margin: "0 auto 40px" }}>
        <div style={{ fontSize: 11, color: "var(--olm-primary)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>
          O fim? Só o começo.
        </div>
        <h2 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(2.25rem, 7vw, 3.5rem)",
          lineHeight: 1.05, letterSpacing: "-0.02em",
          color: "var(--dfg-1)",
          margin: "16px 0 0",
        }}>
          Esse é o nosso <em style={{ color: "var(--olm-primary)" }}>mapa do amor</em>.
        </h2>
      </div>

      {/* the map with polaroids */}
      <div style={{
        position: "relative",
        maxWidth: 560, margin: "0 auto",
        aspectRatio: "1/1.1",
        borderRadius: 24,
        background: "linear-gradient(180deg, #3A3445, #2A2632)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(251,245,240,0.06)",
        overflow: "hidden",
      }}>
        {/* "real map" decoration — winding streets */}
        <svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice"
             style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <pattern id="fg-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(251,245,240,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="400" height="440" fill="url(#fg-grid)"/>
          {/* landmasses */}
          <path d="M -20 280 Q 80 220, 180 260 Q 280 300, 420 240 L 420 460 L -20 460 Z"
                fill="rgba(251,245,240,0.025)"/>
          <path d="M -20 80 Q 120 40, 220 80 Q 320 120, 420 60 L 420 200 Q 280 240, 180 200 Q 80 160, -20 200 Z"
                fill="rgba(251,245,240,0.02)"/>
          {/* streets */}
          {[
            "M 40 100 Q 150 140, 260 110 T 400 160",
            "M 10 200 Q 120 240, 240 220 T 380 260",
            "M 60 320 Q 170 360, 280 340 T 400 380",
            "M 120 20 Q 140 120, 120 220 T 100 440",
            "M 260 0 Q 280 100, 260 200 T 280 440",
          ].map((d, i) => (
            <path key={i} d={d} stroke="rgba(251,245,240,0.05)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          ))}
          {/* route connecting every journey point */}
          <path
            d={journey.map((p, i) => {
              const x = (p.x / 100) * 400;
              const y = (p.y / 100) * 440;
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            }).join(" ")}
            fill="none" stroke="#F56C73" strokeWidth="2.5" strokeDasharray="3 7" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(245,108,115,0.4))" }}
          />
          {/* pins under polaroids */}
          {journey.map(p => {
            const x = (p.x / 100) * 400;
            const y = (p.y / 100) * 440;
            return (
              <g key={p.id} transform={`translate(${x}, ${y})`}>
                <circle r="14" fill="rgba(245,108,115,0.18)"/>
                <circle r="6" fill="#F56C73"/>
                <circle r="2" fill="#fff"/>
              </g>
            );
          })}
        </svg>

        {/* polaroids over each pin */}
        {journey.map((p, i) => {
          const rot = [-6, 4, -3, 5][i] || 0;
          // keep polaroid inside the map: flip below pin if too close to top
          const flipBelow = p.y < 25;
          const yShift = flipBelow ? "18%" : "-118%";
          return (
            <div key={p.id} style={{
              position: "absolute",
              left: `${p.x}%`, top: `${p.y}%`,
              transform: `translate(-50%, ${yShift}) rotate(${rot}deg)`,
              width: 86,
              background: "#FBF5F0",
              padding: "6px 6px 20px",
              borderRadius: 3,
              boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
            }}>
              <div style={{ aspectRatio: 1, background: p.gradient, borderRadius: 1.5 }} />
              <div style={{
                position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
                fontFamily: "var(--font-serif)", fontStyle: "italic",
                fontSize: 9, color: "var(--olm-title)",
              }}>{p.name.split(",")[0].toLowerCase()}</div>
            </div>
          );
        })}

        {/* couple signature */}
        <div style={{
          position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center",
          fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 18,
          color: "var(--dfg-1)", textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}>
          Ana <span style={{ color: "var(--olm-primary)" }}>&amp;</span> Lucas
        </div>
      </div>

      {/* Instagram share CTA */}
      <div style={{ position: "relative", maxWidth: 520, margin: "44px auto 0", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--dfg-2)", lineHeight: 1.55, margin: 0 }}>
          Mostra pro mundo — ou guarda só entre vocês.
        </p>
        <button onClick={shareIG} style={{
          marginTop: 18,
          display: "inline-flex", alignItems: "center", gap: 10,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15,
          padding: "14px 26px", borderRadius: 999, border: "none", cursor: "pointer",
          color: "#fff",
          background: "linear-gradient(135deg, #F56C73 0%, #BF77F6 55%, #413C7B 100%)",
          boxShadow: "0 14px 34px rgba(245,108,115,0.45)",
          letterSpacing: "-0.01em",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
          Compartilhar no Instagram
        </button>
        <div style={{ marginTop: 14 }}>
          <button style={{
            background: "transparent", border: "none", color: "var(--dfg-3)",
            fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)",
          }}>
            copiar link →
          </button>
        </div>

        <div style={{ marginTop: 40, fontSize: 11, color: "var(--dfg-4)", letterSpacing: "0.1em" }}>
          feito com <span style={{ color: "var(--olm-primary)" }}>♥</span> em Our Love Map
        </div>
      </div>
    </section>
  );
};

Object.assign(window, { FinalMap });
