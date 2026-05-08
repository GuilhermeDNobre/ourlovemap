// Bento features + Pricing + FAQ + Final CTA + Footer

const BentoFeatures = () => {
  const tile = (p) => ({
    padding: p.pad || 28, borderRadius: 22,
    background: p.bg || "#FFFFFF",
    border: "1px solid rgba(65,60,123,0.06)",
    display: "flex", flexDirection: "column", justifyContent: "space-between",
    overflow: "hidden", position: "relative",
    minHeight: p.h || 200,
    gridColumn: p.col, gridRow: p.row,
  });
  const H = ({ children, dark }) => <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: dark ? "#fff" : "var(--olm-title)", lineHeight: 1.15 }}>{children}</div>;
  const P = ({ children, dark }) => <div style={{ fontSize: 14, color: dark ? "rgba(251,245,240,0.72)" : "var(--fg-2)", lineHeight: 1.5, marginTop: 8 }}>{children}</div>;
  const Ic = ({ children, dark }) => <div style={{ width: 44, height: 44, borderRadius: 14, background: dark ? "rgba(251,245,240,0.08)" : "rgba(245,108,115,0.12)", color: dark ? "#fff" : "var(--olm-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{children}</div>;

  return (
    <Section id="features" background="var(--olm-bg)">
      <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 56px" }}>
        <Eyebrow>Funcionalidades</Eyebrow>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--olm-title)", margin: "16px 0 0", lineHeight: 1.1 }}>
          Detalhes que fazem vocês dizerem <em style={{ color: "var(--olm-primary)" }}>uau</em>.
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, gridAutoRows: "minmax(190px, auto)" }}>
        {/* Big map tile — dark */}
        <div style={tile({ col: "span 2", row: "span 2", bg: "var(--olm-dark)", h: 400 })}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
            <svg viewBox="0 0 500 400" style={{ width: "100%", height: "100%" }}>
              <defs><pattern id="bfg" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(251,245,240,0.04)" strokeWidth="0.5"/></pattern></defs>
              <rect width="500" height="400" fill="url(#bfg)"/>
              <path d="M 60 320 Q 150 240, 240 260 T 440 80" stroke="#F56C73" strokeWidth="2" strokeDasharray="2 7" fill="none"/>
              {[[60,320],[240,260],[440,80]].map(([x,y],i)=>(
                <g key={i} transform={`translate(${x-10}, ${y-20})`}>
                  <circle cx="10" cy="10" r="18" fill="rgba(245,108,115,0.18)"/>
                  <path d="M10 0 C16 0, 20 4, 20 10 C20 17, 10 22, 10 22 C10 22, 0 17, 0 10 C0 4, 4 0, 10 0 Z" fill="#F56C73"/>
                </g>
              ))}
            </svg>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <Ic dark>◎</Ic>
            <H dark>Mapa interativo com pins</H>
            <P dark>Cada local ganha um pin animado e se conecta em uma rota desenhada à mão.</P>
          </div>
        </div>

        {/* Polaroid upload */}
        <div style={tile({ col: "span 2" })}>
          <div>
            <Ic>◭</Ic>
            <H>Fotos em polaroide</H>
            <P>Upload simples e cada foto aparece na página pública com aquele visual de viagem.</P>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {[-6, 3, -4].map((rot, i) => (
              <div key={i} style={{ width: 70, background: "#fff", padding: "4px 4px 14px", borderRadius: 2, transform: `rotate(${rot}deg)`, boxShadow: "0 6px 16px rgba(65,60,123,0.15)" }}>
                <div style={{ aspectRatio: 1, background: ["linear-gradient(135deg,#FAA2A7,#BF77F6)","linear-gradient(135deg,#BF77F6,#413C7B)","linear-gradient(135deg,#F56C73,#FAA2A7)"][i] }}/>
              </div>
            ))}
          </div>
        </div>

        {/* YouTube timestamp */}
        <div style={tile({})}>
          <Ic>▶</Ic>
          <div>
            <H>Música do YouTube</H>
            <P>Adicione um vídeo com timestamp pra tocar no momento certo.</P>
          </div>
        </div>

        {/* Counter */}
        <div style={tile({ bg: "var(--olm-title)", h: 190 })}>
          <Ic dark>◷</Ic>
          <div>
            <H dark>Contador ao vivo</H>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "#fff", marginTop: 8 }}>2 anos · 7 meses</div>
            <div style={{ fontSize: 12, color: "rgba(251,245,240,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>e ainda contando</div>
          </div>
        </div>

        {/* Instagram share */}
        <div style={tile({ col: "span 2" })}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div>
              <Ic>◉</Ic>
              <H>Compartilhe no Instagram</H>
              <P>Story em 9:16 com a página pronta pra postar, direto do celular.</P>
            </div>
            <div style={{ width: 100, height: 170, borderRadius: 14, background: "linear-gradient(135deg, #F56C73, #BF77F6)", flexShrink: 0, border: "3px solid #fff", boxShadow: "0 10px 22px rgba(191,119,246,0.35)", padding: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "#fff", lineHeight: 1.05 }}>Ana <em>e</em> Lucas</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>ourlovemap.com</div>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div style={tile({ col: "span 2", bg: "#FFFFFF" })}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div>
              <Ic>▦</Ic>
              <H>QR Code por email</H>
              <P>Chega no seu email em instantes, pronto pra presentear ou imprimir.</P>
            </div>
            <div style={{ width: 96, height: 96, padding: 10, background: "#fff", border: "1.5px solid var(--olm-surface)", borderRadius: 12, flexShrink: 0 }}>
              <svg viewBox="0 0 21 21" style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}>
                {Array.from({length: 21}).map((_, y) => Array.from({length: 21}).map((_, x) => {
                  const filled = (x+y*3+((x*y)%5))%3 === 0 || (x<3&&y<3) || (x>17&&y<3) || (x<3&&y>17);
                  return filled ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#25212A"/> : null;
                }))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

const Pricing = () => (
  <Section id="pricing" background="#FFFFFF">
    <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 56px" }}>
      <Eyebrow>Planos</Eyebrow>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--olm-title)", margin: "16px 0 0", lineHeight: 1.1 }}>
        Escolha o plano de <em style={{ color: "var(--olm-primary)" }}>vocês</em>.
      </h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 820, margin: "0 auto" }}>
      {/* Basic */}
      <div style={{ padding: 36, borderRadius: 24, background: "#fff", border: "1px solid var(--olm-surface)" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--olm-title)", letterSpacing: "0.04em" }}>Básico</div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", gap: 4 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 48, color: "var(--olm-title)", lineHeight: 1 }}>R$19<span style={{ fontSize: 28 }}>,90</span></div>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>Pagamento único</div>
        <ul style={{ listStyle: "none", padding: 0, margin: "28px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {["Até 3 localizações", "Página ativa por 7 dias", "QR Code por email", "Suporte por email"].map((t, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--fg-2)" }}>
              <span style={{ color: "var(--olm-primary)" }}>✓</span>{t}
            </li>
          ))}
        </ul>
        <Button variant="secondary" size="md" style={{ width: "100%", justifyContent: "center" }}>Começar pelo básico</Button>
      </div>

      {/* Premium */}
      <div style={{ position: "relative", padding: 36, borderRadius: 24, background: "#fff", border: "2px solid var(--olm-accent)", boxShadow: "0 24px 60px rgba(191,119,246,0.22)" }}>
        <div style={{ position: "absolute", top: -12, left: 24, padding: "5px 12px", background: "var(--olm-primary)", color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Mais escolhido</div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--olm-accent)", letterSpacing: "0.04em" }}>Premium</div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", gap: 4 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 48, color: "var(--olm-title)", lineHeight: 1 }}>R$29<span style={{ fontSize: 28 }}>,90</span></div>
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>Pagamento único, página sem expiração</div>
        <ul style={{ listStyle: "none", padding: 0, margin: "28px 0", display: "flex", flexDirection: "column", gap: 12 }}>
          {["Até 7 localizações", "Página sem expiração", "Música do YouTube com timestamp", "Compartilhamento no Instagram", "Contador do relacionamento", "Suporte prioritário"].map((t, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--fg-2)" }}>
              <span style={{ color: "var(--olm-accent)" }}>✓</span>{t}
            </li>
          ))}
        </ul>
        <Button variant="premium" size="md" style={{ width: "100%", justifyContent: "center" }}>Criar nosso mapa Premium</Button>
      </div>
    </div>
  </Section>
);

const FAQ = () => {
  const [open, setOpen] = React.useState(0);
  const qs = [
    ["Quanto tempo a página fica online?", "No plano Básico, a página fica ativa por 7 dias após a criação. No Premium, ela fica no ar pra sempre, sem expiração."],
    ["Posso editar após o pagamento?", "Sim! Você recebe um link de edição por email e pode atualizar fotos, locais e mensagens a qualquer momento."],
    ["Como recebo o QR Code?", "Assim que o pagamento é confirmado, o QR Code chega no seu email em formato pronto pra imprimir, enviar ou colocar em um cartão."],
    ["Funciona bem no celular?", "Sim — a página foi pensada mobile-first. Quando a pessoa escaneia o QR, abre bonita no celular dela direto."],
    ["Posso adicionar mais localizações depois?", "Pode! É só fazer upgrade pro Premium ou contatar o suporte que ajudamos a ajustar."],
  ];
  return (
    <Section id="faq" background="#FFFFFF">
      <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 48px" }}>
        <Eyebrow>Dúvidas frequentes</Eyebrow>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--olm-title)", margin: "16px 0 0", lineHeight: 1.1 }}>
          A gente <em style={{ color: "var(--olm-primary)" }}>responde</em>.
        </h2>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {qs.map(([q, a], i) => (
          <div key={i} style={{ borderTop: i === 0 ? "1px solid var(--olm-surface)" : "none", borderBottom: "1px solid var(--olm-surface)" }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} style={{
              width: "100%", padding: "22px 4px", background: "transparent", border: "none", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left",
              fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600, color: "var(--olm-title)",
            }}>
              <span>{q}</span>
              <span style={{ transform: open === i ? "rotate(45deg)" : "rotate(0)", transition: "transform 200ms var(--ease-emphasized)", color: "var(--olm-primary)", fontSize: 22 }}>+</span>
            </button>
            <div style={{ maxHeight: open === i ? 200 : 0, overflow: "hidden", transition: "max-height 300ms var(--ease-emphasized)" }}>
              <div style={{ padding: "0 4px 22px", fontSize: 15, lineHeight: 1.6, color: "var(--fg-2)", maxWidth: 640 }}>{a}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

const FinalCTA = ({ onCta }) => (
  <Section background="linear-gradient(180deg, var(--olm-title), var(--olm-dark))" style={{ padding: "112px 24px" }}>
    <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 18, color: "var(--olm-primary)", letterSpacing: "0.4em" }}>♥ ♥ ♥</div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.5rem, 5vw, 3.75rem)", color: "#fff", margin: "28px 0 20px", lineHeight: 1.02 }}>
        Crie o <em style={{ color: "var(--olm-primary)" }}>mapa do amor</em> de vocês.
      </h2>
      <p style={{ fontSize: 18, color: "rgba(251,245,240,0.7)", lineHeight: 1.5, margin: "0 auto 36px", maxWidth: 480 }}>
        Alguns minutos agora. Uma memória que vocês vão querer ver pra sempre.
      </p>
      <Button size="lg" onClick={onCta}>Começar agora <ArrowRight /></Button>
      <div style={{ marginTop: 18, fontSize: 12, color: "rgba(251,245,240,0.5)", letterSpacing: "0.08em" }}>PAGAMENTO ÚNICO · SEM ASSINATURA</div>
    </div>
  </Section>
);

const Footer = () => (
  <footer style={{ background: "var(--olm-dark)", padding: "56px 24px 32px", color: "rgba(251,245,240,0.6)" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src="../../assets/logo.svg" style={{ width: 26, height: 26, filter: "brightness(0) invert(1)" }} />
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "#fff" }}>
          Our Love <em style={{ color: "var(--olm-primary)" }}>Map</em>
        </span>
      </div>
      <div style={{ display: "flex", gap: 28, fontSize: 13 }}>
        <a href="#" style={{ color: "rgba(251,245,240,0.6)", textDecoration: "none" }}>Termos</a>
        <a href="#" style={{ color: "rgba(251,245,240,0.6)", textDecoration: "none" }}>Privacidade</a>
        <a href="#" style={{ color: "rgba(251,245,240,0.6)", textDecoration: "none" }}>Contato</a>
        <a href="#" style={{ color: "rgba(251,245,240,0.6)", textDecoration: "none" }}>Instagram</a>
      </div>
    </div>
    <div style={{ maxWidth: 1120, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid rgba(251,245,240,0.08)", fontSize: 12, color: "rgba(251,245,240,0.4)", textAlign: "center" }}>
      © 2026 Our Love Map · Feito com ♥ pra vocês
    </div>
  </footer>
);

Object.assign(window, { BentoFeatures, Pricing, FAQ, FinalCTA, Footer });
