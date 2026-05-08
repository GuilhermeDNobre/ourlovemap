// Sections: How it works, Preview experience, Use cases

const HowItWorks = () => {
  const steps = [
    { n: "01", title: "Preencha os momentos", body: "Adicione fotos, locais marcantes e mensagens da história de vocês.", icon: "✎" },
    { n: "02", title: "Escolha seu plano",     body: "Básico para um presente rápido ou Premium sem expiração.",        icon: "♥" },
    { n: "03", title: "Receba o QR Code",       body: "Chega no seu email, pronto pra imprimir, enviar ou surpreender.", icon: "✦" },
  ];
  return (
    <Section id="how" background="#FFFFFF">
      <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 64px" }}>
        <Eyebrow>Como funciona</Eyebrow>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--olm-title)", margin: "16px 0 12px", lineHeight: 1.1 }}>
          Três passos. <em style={{ color: "var(--olm-primary)" }}>Uma</em> memória pra sempre.
        </h2>
        <p style={{ fontSize: 16, color: "var(--fg-2)" }}>Do primeiro encontro ao QR Code na mão em poucos minutos.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ position: "relative", textAlign: "left" }}>
            {i < 2 && (
              <svg style={{ position: "absolute", top: 28, left: "calc(100% - 24px)", width: 48, height: 14, color: "var(--olm-surface)" }} viewBox="0 0 48 14" fill="none">
                <path d="M1 7 Q 24 -6, 47 7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round"/>
              </svg>
            )}
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(245,108,115,0.12)", color: "var(--olm-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18 }}>{s.icon}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--olm-primary)", letterSpacing: "0.04em" }}>{s.n}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--olm-title)", margin: "6px 0 10px", lineHeight: 1.15 }}>{s.title}</div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--fg-2)" }}>{s.body}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const PreviewExperience = () => (
  <Section background="var(--olm-bg)">
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <DarkMockup size="lg" />
      </div>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(191,119,246,0.12)", color: "var(--olm-accent)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--olm-accent)" }} /> Exclusivo
        </div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--olm-title)", margin: "20px 0 16px", lineHeight: 1.05 }}>
          Uma experiência que eles <em style={{ color: "var(--olm-primary)" }}>nunca</em> vão esquecer.
        </h2>
        <p style={{ fontSize: 17, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 28 }}>
          A pessoa escaneia o QR Code e abre uma página só de vocês — com mapa, pins animados, polaroides e o contador rodando em tempo real.
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "Mapa interativo com rota entre os lugares",
            "Fotos em polaroide estilo viagem",
            "Contador do relacionamento ao vivo",
            "Funciona perfeitamente no celular",
          ].map((t, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: "var(--fg-2)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "var(--olm-primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </Section>
);

const UseCases = () => {
  const cases = [
    { icon: "💍", title: "Pedido de casamento",     body: "Revele o grande momento com um mapa que conta tudo." },
    { icon: "🗓️", title: "Aniversário de namoro",    body: "Um presente que lembra cada virada do calendário." },
    { icon: "✈️", title: "Viagem inesquecível",       body: "Os lugares onde vocês se perderam (e se acharam)." },
    { icon: "☕", title: "Primeiro encontro",         body: "Comece a história com estilo, já no dia um." },
  ];
  return (
    <Section background="#FFFFFF">
      <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
        <Eyebrow>Pra cada momento de vocês</Eyebrow>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--olm-title)", margin: "16px 0 0", lineHeight: 1.1 }}>
          Feito pra qualquer <em style={{ color: "var(--olm-primary)" }}>ocasião</em>.
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
        {cases.map((c, i) => (
          <div key={i} className="use-card" style={{
            padding: "28px 24px", borderRadius: 20, background: "var(--olm-bg)",
            border: "1px solid rgba(65,60,123,0.06)",
            transition: "transform 200ms var(--ease-emphasized), box-shadow 200ms var(--ease-emphasized)",
            cursor: "pointer",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 18px 40px rgba(65,60,123,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 14 }}>{c.icon}</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--olm-title)", lineHeight: 1.15, marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.5 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

Object.assign(window, { HowItWorks, PreviewExperience, UseCases });
