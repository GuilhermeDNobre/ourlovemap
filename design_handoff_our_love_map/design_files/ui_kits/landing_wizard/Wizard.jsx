// Wizard — 4 steps:
//   1. Vocês       — names + start date + description
//   2. Localizações — list of places (address, name, description, photo) — drag to reorder
//   3. Música       — YouTube search + start/end + loop toggle
//   4. Envio        — email + email confirmation
//
// Layout: form on the left, sticky live preview on the right (mirrors the
// real public-map page).

const STEPS = [
  { n: 1, label: "Vocês" },
  { n: 2, label: "Localizações" },
  { n: 3, label: "Música" },
  { n: 4, label: "Envio" },
];

// ─── Progress ────────────────────────────────────────────────────────────────
const ProgressDots = ({ current }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    {STEPS.map((s, i) => (
      <React.Fragment key={s.n}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          color: s.n <= current ? "var(--olm-title)" : "var(--fg-4)",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 999,
            background: s.n < current ? "var(--olm-primary)" : s.n === current ? "var(--olm-title)" : "var(--olm-surface)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
            transition: "background 200ms",
          }}>{s.n < current ? "✓" : s.n}</div>
          {s.label}
        </div>
        {i < STEPS.length - 1 && <div style={{ width: 22, height: 2, background: s.n < current ? "var(--olm-primary)" : "var(--olm-surface)", borderRadius: 2 }} />}
      </React.Fragment>
    ))}
  </div>
);

// ─── Field primitives ────────────────────────────────────────────────────────
const Field = ({ label, help, error, children, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && (
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--olm-title)", letterSpacing: "0.02em" }}>
        {label}{required && <span style={{ color: "var(--olm-primary)" }}> *</span>}
      </label>
    )}
    {children}
    {(help || error) && <div style={{ fontSize: 11, color: error ? "var(--olm-error)" : "var(--fg-3)" }}>{error || help}</div>}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = "text", error }) => (
  <input
    type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
    style={{
      fontFamily: "var(--font-sans)", fontSize: 14,
      padding: "11px 14px", borderRadius: 12,
      border: `1.5px solid ${error ? "var(--olm-error)" : "#E0DCE5"}`,
      background: "#fff", color: "var(--fg-2)", outline: "none",
      transition: "border-color 150ms",
    }}
    onFocus={e => (e.target.style.borderColor = error ? "var(--olm-error)" : "var(--olm-accent)")}
    onBlur={e => (e.target.style.borderColor = error ? "var(--olm-error)" : "#E0DCE5")}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
    style={{
      fontFamily: "var(--font-sans)", fontSize: 14, padding: "11px 14px", borderRadius: 12,
      border: "1.5px solid #E0DCE5", background: "#fff", color: "var(--fg-2)", outline: "none",
      resize: "vertical",
    }}
    onFocus={e => (e.target.style.borderColor = "var(--olm-accent)")}
    onBlur={e => (e.target.style.borderColor = "#E0DCE5")}
  />
);

// ─── Step 1: Vocês ───────────────────────────────────────────────────────────
const Step1 = ({ data, setData }) => (
  <div style={{ display: "grid", gap: 18 }}>
    <Field label="Nomes do casal" help="Aparece no topo do mapa" required>
      <TextInput value={data.names} onChange={v => setData({ ...data, names: v })} placeholder="Ana e Lucas" />
    </Field>
    <Field label="Quando começou" help="Vai gerar o contador ao vivo do relacionamento" required>
      <TextInput type="date" value={data.startDate} onChange={v => setData({ ...data, startDate: v })} />
    </Field>
    <Field label="Uma frase pra abrir o mapa" help="Pode ser uma piada interna, um trecho de música, qualquer coisa">
      <Textarea value={data.opening} onChange={v => setData({ ...data, opening: v })} placeholder="Começou num café em Alfama, nunca mais parou…" />
    </Field>
  </div>
);

// ─── Step 2: Localizações (drag to reorder) ─────────────────────────────────
const PlaceCardEditor = ({ place, index, total, onChange, onRemove, onDragStart, onDragOver, onDrop, dragging, dragOver }) => {
  const fileRef = React.useRef(null);
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    onChange({ ...place, photo: url });
  };
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(); }}
      onDrop={onDrop}
      style={{
        background: dragging ? "rgba(245,108,115,0.04)" : "var(--olm-surface-soft)",
        border: `1.5px solid ${dragOver ? "var(--olm-accent)" : dragging ? "rgba(245,108,115,0.4)" : "transparent"}`,
        borderRadius: 16, padding: 14,
        display: "grid", gap: 10,
        opacity: dragging ? 0.5 : 1,
        transition: "border-color 120ms, background 120ms, opacity 120ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ cursor: "grab", color: "var(--fg-4)", display: "flex", alignItems: "center", padding: "0 4px" }} title="Arrastar pra reordenar">
          <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor"><circle cx="3" cy="3" r="1.6"/><circle cx="11" cy="3" r="1.6"/><circle cx="3" cy="10" r="1.6"/><circle cx="11" cy="10" r="1.6"/><circle cx="3" cy="17" r="1.6"/><circle cx="11" cy="17" r="1.6"/></svg>
        </div>
        <div style={{
          width: 26, height: 26, borderRadius: 999,
          background: "var(--olm-primary)", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-serif)", fontSize: 13,
        }}>{index + 1}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--olm-primary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Lugar {index + 1}
        </div>
        <div style={{ flex: 1 }} />
        {total > 1 && (
          <button onClick={onRemove} style={{ background: "transparent", border: "none", color: "var(--fg-4)", cursor: "pointer", fontSize: 18, padding: 4 }} title="Remover">×</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 12, alignItems: "stretch" }}>
        {/* photo upload */}
        <button
          type="button" onClick={() => fileRef.current?.click()}
          style={{
            aspectRatio: 1, background: "#fff",
            border: "1.5px dashed var(--olm-surface)", borderRadius: 10,
            cursor: "pointer", padding: 0, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--fg-4)", fontSize: 11,
          }}
        >
          {place.photo ? (
            <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>+ foto</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPick} />
        {/* fields */}
        <div style={{ display: "grid", gap: 8 }}>
          <TextInput value={place.name} onChange={v => onChange({ ...place, name: v })} placeholder="Nome do lugar (ex: Lisboa, Alfama)" />
          <TextInput value={place.address} onChange={v => onChange({ ...place, address: v })} placeholder="Endereço completo" />
        </div>
      </div>
      <Textarea value={place.note} onChange={v => onChange({ ...place, note: v })} placeholder="Uma lembrança em uma ou duas linhas…" rows={2} />
    </div>
  );
};

const Step2 = ({ data, setData }) => {
  const [draggingIdx, setDraggingIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);

  const setPlace = (i, p) => {
    const next = [...data.places]; next[i] = p; setData({ ...data, places: next });
  };
  const remove = (i) => setData({ ...data, places: data.places.filter((_, k) => k !== i) });
  const add = () => setData({ ...data, places: [...data.places, { name: "", address: "", note: "", photo: null }] });

  const onDrop = (toIdx) => {
    if (draggingIdx == null || draggingIdx === toIdx) {
      setDraggingIdx(null); setOverIdx(null); return;
    }
    const next = [...data.places];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(toIdx, 0, moved);
    setData({ ...data, places: next });
    setDraggingIdx(null); setOverIdx(null);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
        Arraste pelo ícone <span style={{ color: "var(--fg-3)" }}>⋮⋮</span> pra reordenar. A ordem aqui é a mesma que aparece no mapa.
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {data.places.map((p, i) => (
          <PlaceCardEditor
            key={i} place={p} index={i} total={data.places.length}
            onChange={(np) => setPlace(i, np)}
            onRemove={() => remove(i)}
            onDragStart={() => setDraggingIdx(i)}
            onDragOver={() => setOverIdx(i)}
            onDrop={() => onDrop(i)}
            dragging={draggingIdx === i}
            dragOver={overIdx === i && draggingIdx !== null && draggingIdx !== i}
          />
        ))}
      </div>
      <button onClick={add} style={{
        background: "transparent", border: "1.5px dashed var(--olm-surface)",
        borderRadius: 14, padding: "14px", cursor: "pointer",
        color: "var(--olm-title)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
        letterSpacing: "0.02em",
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--olm-accent)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--olm-surface)")}
      >+ Adicionar lugar</button>
      <div style={{ fontSize: 11, color: "var(--fg-4)", textAlign: "right" }}>{data.places.length} de 7 (Premium)</div>
    </div>
  );
};

// ─── Step 3: Música ──────────────────────────────────────────────────────────
const Step3 = ({ data, setData }) => {
  const M = data.music;
  const setM = (k, v) => setData({ ...data, music: { ...M, [k]: v } });
  const fmt = (s) => {
    const m = Math.floor(s/60), ss = Math.floor(s%60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Field label="Buscar a música no YouTube" help="Cole o link do YouTube ou digite pra buscar">
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--fg-4)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input value={M.query} onChange={e => setM("query", e.target.value)} placeholder="ex: 'A Thousand Years' ou youtube.com/watch?v=…"
            style={{
              width: "100%", padding: "11px 14px 11px 38px", borderRadius: 12,
              border: "1.5px solid #E0DCE5", background: "#fff", fontFamily: "var(--font-sans)", fontSize: 14, outline: "none",
            }}/>
        </div>
      </Field>

      {/* Mock track preview */}
      {M.query && (
        <div style={{
          display: "flex", gap: 12, alignItems: "center",
          padding: 12, background: "var(--olm-surface-soft)", borderRadius: 14,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: "linear-gradient(135deg, #F56C73, #BF77F6)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--olm-title)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{M.query}</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>YouTube · 4:32</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label={`Início — ${fmt(M.start)}`}>
          <input type="range" min="0" max="270" value={M.start} onChange={e => setM("start", +e.target.value)}
            style={{ accentColor: "var(--olm-primary)" }} />
        </Field>
        <Field label={`Fim — ${fmt(M.end)}`}>
          <input type="range" min={M.start + 5} max="272" value={M.end} onChange={e => setM("end", +e.target.value)}
            style={{ accentColor: "var(--olm-accent)" }} />
        </Field>
      </div>

      {/* Loop toggle */}
      <button onClick={() => setM("loop", !M.loop)} style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 14, border: "1.5px solid #E0DCE5", background: "#fff", cursor: "pointer",
        textAlign: "left", fontFamily: "var(--font-sans)",
      }}>
        <div style={{
          width: 40, height: 24, borderRadius: 999,
          background: M.loop ? "var(--olm-primary)" : "var(--olm-surface)",
          position: "relative", flexShrink: 0, transition: "background 150ms",
        }}>
          <div style={{
            position: "absolute", top: 2, left: M.loop ? 18 : 2,
            width: 20, height: 20, borderRadius: 999, background: "#fff",
            transition: "left 150ms var(--ease-emphasized)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--olm-title)" }}>Repetir em loop</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>A música toca em looping enquanto a pessoa explora.</div>
        </div>
      </button>
    </div>
  );
};

// ─── Step 4: Envio ───────────────────────────────────────────────────────────
const Step4 = ({ data, setData }) => {
  const mismatch = data.email && data.emailConfirm && data.email !== data.emailConfirm;
  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div style={{
        padding: "16px 18px",
        background: "linear-gradient(135deg, rgba(245,108,115,0.08), rgba(191,119,246,0.08))",
        border: "1px solid rgba(245,108,115,0.18)",
        borderRadius: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--olm-primary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Importante
        </div>
        <div style={{ fontSize: 14, color: "var(--olm-title)", marginTop: 6, lineHeight: 1.55 }}>
          O <strong>QR Code e o link de edição</strong> serão enviados <strong>somente para esse email</strong>. Confira com cuidado — sem ele, vocês não conseguem acessar o mapa depois.
        </div>
      </div>

      <Field label="Email pra receber o QR Code" required>
        <TextInput type="email" value={data.email} onChange={v => setData({ ...data, email: v })} placeholder="seu@email.com" />
      </Field>

      <Field label="Confirme o email" error={mismatch ? "Os emails não coincidem." : null} required>
        <TextInput type="email" value={data.emailConfirm} onChange={v => setData({ ...data, emailConfirm: v })} placeholder="seu@email.com" error={mismatch} />
      </Field>

      {/* Summary */}
      <div style={{
        background: "var(--olm-surface-soft)", borderRadius: 16, padding: 16,
        display: "grid", gap: 8,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--olm-title)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Resumo</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--fg-3)" }}>Casal</span>
          <span style={{ color: "var(--olm-title)", fontWeight: 600 }}>{data.names || "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--fg-3)" }}>Lugares</span>
          <span style={{ color: "var(--olm-title)", fontWeight: 600 }}>{data.places.length}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--fg-3)" }}>Música</span>
          <span style={{ color: "var(--olm-title)", fontWeight: 600 }}>{data.music.query ? "✓" : "—"}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Live preview (right side) ──────────────────────────────────────────────
const LivePreview = ({ data, step }) => {
  const place = data.places[0] || {};
  const counter = (() => {
    if (!data.startDate) return null;
    const now = new Date();
    const start = new Date(data.startDate);
    if (isNaN(start)) return null;
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    if (days < 0) { months -= 1; const prev = new Date(now.getFullYear(), now.getMonth(), 0); days += prev.getDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return { years, months, days };
  })();

  // Slug derived from couple names: "Ana e Lucas" -> "ana-e-lucas"
  const slug = (data.names || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") || "seu-mapa";

  const fullUrl = `ourlovemap.com/${slug}`;

  return (
    <aside style={{
      position: "sticky", top: 96,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* SLUG / URL preview card */}
      <div style={{
        background: "#fff", borderRadius: 18, padding: "14px 16px",
        boxShadow: "var(--sh-md)", border: "1px solid rgba(65,60,123,0.06)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--olm-primary)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
          O link de vocês
        </div>
        <div style={{
          display: "flex", alignItems: "baseline",
          fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
          fontSize: 14, lineHeight: 1.3,
          padding: "10px 12px",
          background: "var(--olm-surface-soft)",
          borderRadius: 10,
          overflow: "hidden",
        }}>
          <span style={{ color: "var(--fg-4)", flexShrink: 0 }}>ourlovemap.com/</span>
          <span style={{
            color: "var(--olm-title)", fontWeight: 700,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{slug}</span>
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 6, lineHeight: 1.4 }}>
          Gerado a partir do nome do casal. Acesso protegido por token enviado no email.
        </div>
      </div>

      {/* Live phone preview */}
      <div style={{
        background: "#fff", borderRadius: 28, padding: 20,
        boxShadow: "var(--sh-lg)",
        border: "1px solid rgba(65,60,123,0.06)",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--olm-primary)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Prévia ao vivo</div>
        <div style={{ fontSize: 11, color: "var(--fg-4)" }}>passo {step}/4</div>
      </div>

      <div style={{
        aspectRatio: "9/16",
        borderRadius: 22, overflow: "hidden",
        background: "var(--olm-dark)", color: "var(--dfg-1)",
        position: "relative",
        display: "flex", flexDirection: "column",
        boxShadow: "inset 0 0 0 1px rgba(251,245,240,0.06)",
      }}>
        {/* Map backdrop */}
        <svg viewBox="0 0 280 500" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <pattern id="lp-grid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(251,245,240,0.05)" strokeWidth="0.5"/>
            </pattern>
            <radialGradient id="lp-glow" cx="50%" cy="55%" r="50%">
              <stop offset="0%" stopColor="rgba(245,108,115,0.22)"/>
              <stop offset="100%" stopColor="rgba(37,33,42,0)"/>
            </radialGradient>
          </defs>
          <rect width="280" height="500" fill="url(#lp-grid)"/>
          {[
            "M -20 100 Q 80 80, 160 100 T 320 80",
            "M -20 200 Q 80 240, 160 220 T 320 250",
            "M -20 360 Q 100 340, 180 360 T 320 340",
            "M 60 -20 Q 80 200, 60 380 T 60 520",
            "M 200 -20 Q 220 200, 200 380 T 200 520",
          ].map((d, i) => (
            <path key={i} d={d} stroke="rgba(251,245,240,0.06)" strokeWidth="1.2" fill="none"/>
          ))}
          <circle cx="140" cy="280" r="160" fill="url(#lp-glow)"/>
          {/* route across stops */}
          {data.places.length > 1 && (
            <path
              d={data.places.map((_, i) => {
                const x = 60 + ((i * 70) % 200);
                const y = 100 + i * 80;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              }).join(" ")}
              stroke="#F56C73" strokeWidth="2" strokeDasharray="2 6" fill="none" strokeLinecap="round"
            />
          )}
          {/* pins for each place */}
          {data.places.map((p, i) => {
            const x = 60 + ((i * 70) % 200);
            const y = 100 + i * 80;
            return (
              <g key={i} transform={`translate(${x-7}, ${y-16})`}>
                <circle cx="7" cy="9" r="11" fill="rgba(245,108,115,0.18)"/>
                <path d="M7 0 C11 0, 14 3, 14 7 C14 12, 7 18, 7 18 C7 18, 0 12, 0 7 C0 3, 3 0, 7 0 Z" fill="#F56C73"/>
                <circle cx="7" cy="7" r="2.5" fill="#FBF5F0"/>
              </g>
            );
          })}
        </svg>

        {/* Foreground content */}
        <div style={{ position: "relative", padding: "20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="../../assets/logo-cream.svg" style={{ width: 18, height: 18, opacity: 0.85 }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--dfg-3)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Our Love Map</span>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 9, color: "var(--olm-primary)", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>Um mapa pra você</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, lineHeight: 1.05, marginTop: 6, letterSpacing: "-0.01em" }}>
              {(data.names || "Ana e Lucas").split(" e ")[0]} <em style={{ color: "var(--olm-primary)" }}>e</em> {(data.names || "Ana e Lucas").split(" e ")[1] || ""}
            </div>
            {data.opening && (
              <div style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 12, color: "var(--dfg-2)", marginTop: 8, lineHeight: 1.4 }}>
                "{data.opening}"
              </div>
            )}
            {counter && (
              <div style={{
                marginTop: 12, padding: "5px 10px",
                background: "rgba(251,245,240,0.06)", border: "1px solid rgba(251,245,240,0.1)",
                borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 9, color: "var(--dfg-2)", fontVariantNumeric: "tabular-nums",
              }}>
                <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--olm-primary)" }} />
                <b style={{ color: "var(--dfg-1)", fontWeight: 600 }}>{counter.years}</b>a · <b style={{ color: "var(--dfg-1)", fontWeight: 600 }}>{counter.months}</b>m · <b style={{ color: "var(--dfg-1)", fontWeight: 600 }}>{counter.days}</b>d
              </div>
            )}
          </div>

          {/* polaroid of place 1 (when on step 2+) */}
          {step >= 2 && place.name && (
            <div style={{
              alignSelf: "flex-end",
              marginTop: "auto",
              width: 110, transform: "rotate(-3deg)",
              background: "#FBF5F0", padding: "5px 5px 18px", borderRadius: 3,
              boxShadow: "0 12px 24px rgba(0,0,0,0.5)",
              position: "relative",
            }}>
              <div style={{ aspectRatio: 1, borderRadius: 1.5, background: place.photo ? `url(${place.photo}) center/cover` : "linear-gradient(135deg, #FAA2A7, #BF77F6)" }} />
              <div style={{
                position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
                fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 9, color: "var(--olm-title)",
              }}>{place.name.split(",")[0].toLowerCase()}</div>
            </div>
          )}

          {/* music chip when on step 3+ */}
          {step >= 3 && data.music.query && (
            <div style={{
              position: "absolute", left: 18, bottom: 18,
              padding: "6px 10px",
              background: "rgba(37,33,42,0.7)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(251,245,240,0.1)",
              borderRadius: 999,
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 10, color: "var(--dfg-1)", maxWidth: 160,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.music.query}</span>
              {data.music.loop && <span style={{ color: "var(--olm-primary)" }}>↻</span>}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--fg-3)" }}>
        <span>{data.places.length} lugar(es)</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--olm-success)" }} /> atualiza ao vivo
        </span>
      </div>
      </div>
    </aside>
  );
};

// ─── Wizard root ─────────────────────────────────────────────────────────────
const Wizard = ({ onClose }) => {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    names: "Ana e Lucas",
    startDate: "2023-02-14",
    opening: "Começou num café em Alfama, nunca mais parou.",
    places: [
      { name: "Lisboa, Alfama",    address: "R. dos Bacalhoeiros, Lisboa, Portugal", note: "Onde tudo começou.",         photo: null },
      { name: "Paris, Montmartre", address: "Rue Lepic, 75018 Paris, França",         note: "A primeira viagem juntos.", photo: null },
    ],
    music: { query: "", start: 0, end: 60, loop: true },
    email: "",
    emailConfirm: "",
  });

  const canProceed = (() => {
    if (step === 1) return data.names && data.startDate;
    if (step === 2) return data.places.length >= 1 && data.places.every(p => p.name);
    if (step === 4) return data.email && data.email === data.emailConfirm && /\S+@\S+\.\S+/.test(data.email);
    return true;
  })();

  const next = () => (step < 4 ? setStep(step + 1) : alert("QR Code a caminho do seu email!"));
  const back = () => (step > 1 ? setStep(step - 1) : onClose?.());

  const titles = {
    1: <>Conta sobre <em style={{ color: "var(--olm-primary)" }}>vocês</em>.</>,
    2: <>Os <em style={{ color: "var(--olm-primary)" }}>lugares</em> da história.</>,
    3: <>A <em style={{ color: "var(--olm-primary)" }}>trilha sonora</em> de vocês.</>,
    4: <>Quase <em style={{ color: "var(--olm-primary)" }}>lá</em>.</>,
  };
  const subtitles = {
    1: "Comece pelo básico — esses dados aparecem na capa do mapa.",
    2: "Adicione cada lugar, com foto e endereço. Arraste pra reordenar.",
    3: "Escolha uma música pra tocar quando a pessoa abrir a página.",
    4: "Onde a gente envia o QR Code? É o único caminho de volta.",
  };

  return (
    <section style={{ padding: "32px 32px 96px", maxWidth: 1240, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <ProgressDots current={step} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 1fr)", gap: 36, alignItems: "start" }}>
        {/* LEFT: form */}
        <div style={{ background: "#fff", borderRadius: 28, padding: 32, boxShadow: "var(--sh-md)", border: "1px solid rgba(65,60,123,0.05)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 32, color: "var(--olm-title)", margin: 0, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            {titles[step]}
          </h2>
          <p style={{ fontSize: 14, color: "var(--fg-2)", margin: "8px 0 0", lineHeight: 1.55 }}>{subtitles[step]}</p>

          <div style={{ marginTop: 28 }}>
            {step === 1 && <Step1 data={data} setData={setData} />}
            {step === 2 && <Step2 data={data} setData={setData} />}
            {step === 3 && <Step3 data={data} setData={setData} />}
            {step === 4 && <Step4 data={data} setData={setData} />}
          </div>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(65,60,123,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
            <Button variant="ghost" onClick={back}>← {step === 1 ? "Voltar pro site" : "Voltar"}</Button>
            <Button onClick={next} style={{ opacity: canProceed ? 1 : 0.5, pointerEvents: canProceed ? "auto" : "none" }}>
              {step === 4 ? "Enviar QR Code" : "Continuar"} <ArrowRight />
            </Button>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <LivePreview data={data} step={step} />
      </div>
    </section>
  );
};

Object.assign(window, { Wizard });
