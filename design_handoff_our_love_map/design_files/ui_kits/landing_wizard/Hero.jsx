// Navbar + Hero with dark mockup preview

const Navbar = ({ onCta }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 40, height: 72, padding: "0 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(251,245,240,0.78)" : "var(--olm-bg)",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(65,60,123,0.08)" : "1px solid transparent",
      transition: "all 200ms var(--ease-standard)",
    }}>
      <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <img src="../../assets/logo.svg" style={{ width: 26, height: 26 }} />
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 21, color: "var(--olm-title)" }}>
          Our Love <em style={{ color: "var(--olm-primary)" }}>Map</em>
        </span>
      </a>
      <div style={{ display: "flex", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        {[["Como funciona", "#how"], ["Funcionalidades", "#features"], ["Preços", "#pricing"], ["FAQ", "#faq"]].map(([l, h]) => (
          <a key={l} href={h} style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--olm-title)", textDecoration: "none" }}>{l}</a>
        ))}
      </div>
      <Button onClick={onCta}>Criar nosso mapa <ArrowRight /></Button>
    </nav>
  );
};

// Dark product mockup — used in hero + preview section
const DarkMockup = ({ size = "md" }) => {
  const w = size === "lg" ? 420 : 340;
  return (
    <div style={{
      width: w, borderRadius: 28, overflow: "hidden",
      background: "var(--olm-dark)", boxShadow: "0 40px 80px rgba(65,60,123,0.25), 0 16px 32px rgba(0,0,0,0.2)",
      border: "1px solid rgba(251,245,240,0.06)", position: "relative",
    }}>
      <div style={{ height: 28, background: "var(--olm-dark-800)", display: "flex", alignItems: "center", gap: 6, padding: "0 12px" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#5A5363" }} />
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#5A5363" }} />
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "#5A5363" }} />
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--dfg-4)", letterSpacing: "0.1em" }}>ourlovemap.com/ana-e-lucas</span>
      </div>
      <div style={{ padding: 18, color: "var(--dfg-1)" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.1 }}>
          Ana <em style={{ color: "var(--olm-primary)" }}>e</em> Lucas
        </div>
        <div style={{ fontSize: 10, color: "var(--dfg-3)", letterSpacing: "0.1em", marginTop: 4 }}>2 ANOS · 7 MESES · 14 DIAS</div>
        <div style={{ position: "relative", height: 220, marginTop: 14, borderRadius: 14, background: "linear-gradient(180deg, #332E3A, #25212A)", overflow: "hidden" }}>
          <svg viewBox="0 0 300 220" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs><pattern id="mg" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(251,245,240,0.05)" strokeWidth="0.5"/></pattern></defs>
            <rect width="300" height="220" fill="url(#mg)"/>
            <path d="M 40 180 Q 80 120, 150 140 T 260 40" stroke="#F56C73" strokeWidth="2" strokeDasharray="2 6" fill="none" strokeLinecap="round"/>
            {[[40,180],[150,140],[260,40]].map(([x,y],i)=>(
              <g key={i} transform={`translate(${x-8}, ${y-16})`}>
                <circle cx="8" cy="8" r="12" fill="rgba(245,108,115,0.2)"/>
                <path d="M8 0 C13 0, 16 3, 16 8 C16 14, 8 18, 8 18 C8 18, 0 14, 0 8 C0 3, 3 0, 8 0 Z" fill="#F56C73"/>
              </g>
            ))}
          </svg>
          {/* polaroid over pin */}
          <div style={{ position: "absolute", top: 40, right: 16, width: 74, background: "#FBF5F0", padding: "5px 5px 18px", borderRadius: 3, transform: "rotate(4deg)", boxShadow: "0 10px 22px rgba(0,0,0,0.5)" }}>
            <div style={{ aspectRatio: 1, background: "linear-gradient(135deg, #FAA2A7, #BF77F6)", borderRadius: 1.5 }} />
            <div style={{ position: "absolute", bottom: 3, left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 8, color: "var(--olm-title)" }}>paris</div>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(251,245,240,0.04)", borderRadius: 12, border: "1px solid rgba(251,245,240,0.08)" }}>
          <div style={{ fontSize: 9, color: "var(--olm-primary)", letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}>Primeiro encontro</div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, marginTop: 2 }}>Lisboa, Alfama</div>
          <div style={{ fontSize: 11, color: "var(--dfg-3)", marginTop: 3, fontStyle: "italic", fontFamily: "var(--font-serif)" }}>"Onde tudo começou."</div>
        </div>
      </div>
    </div>
  );
};

const Hero = ({ onCta }) => (
  <Section background="var(--olm-bg)" style={{ padding: "72px 24px 112px" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" }}>
      <div>
        <Eyebrow>Para vocês dois</Eyebrow>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.75rem, 5.5vw, 4.25rem)", lineHeight: 1.02, letterSpacing: "-0.02em", color: "var(--olm-title)", margin: "22px 0 0" }}>
          O mapa de tudo<br/>que vocês <em style={{ color: "var(--olm-primary)" }}>viveram</em><br/>juntos.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "var(--fg-2)", marginTop: 24, maxWidth: 480 }}>
          Uma página privada com os lugares, as fotos e as mensagens da história de vocês — entregue por QR Code no seu e-mail.
        </p>
        <div style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Button size="lg" onClick={onCta}>Criar nosso mapa <ArrowRight /></Button>
          <Button variant="secondary" size="lg">Ver exemplo</Button>
        </div>
        <div style={{ marginTop: 28, fontSize: 13, color: "var(--fg-3)" }}>♥ Mais de 3.200 casais já criaram o deles</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <DarkMockup size="md" />
      </div>
    </div>
  </Section>
);

Object.assign(window, { Navbar, Hero, DarkMockup });
