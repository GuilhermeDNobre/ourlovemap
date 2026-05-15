// Shared primitives — pill Button, Input, Chip, Card

const Button = ({ variant = "primary", size = "md", children, onClick, style }) => {
  const sizes = { sm: { padding: "9px 16px", fontSize: 13 }, md: { padding: "11px 20px", fontSize: 14 }, lg: { padding: "14px 26px", fontSize: 16 } };
  const variants = {
    primary: { background: "var(--olm-primary)", color: "#fff", boxShadow: "var(--sh-glow-primary)" },
    secondary: { background: "transparent", color: "var(--olm-title)", border: "1.5px solid var(--olm-title)" },
    premium: { background: "var(--olm-title)", color: "#fff", border: "1.5px solid var(--olm-accent)", boxShadow: "0 10px 28px rgba(191,119,246,0.35)" },
    ghost: { background: "transparent", color: "var(--olm-title)" },
    text: { background: "transparent", color: "var(--olm-primary)", padding: 0 },
    white: { background: "#fff", color: "var(--olm-title)" },
  };
  return (
    <button onClick={onClick} style={{
      fontFamily: "var(--font-sans)", fontWeight: 600, borderRadius: 999, border: "none", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 8, letterSpacing: "-0.01em",
      transition: "transform 150ms var(--ease-emphasized)",
      ...sizes[size], ...variants[variant], ...style,
    }}
      onMouseDown={e => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >{children}</button>
  );
};

const ArrowRight = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
);

const Input = ({ label, value, onChange, placeholder, help, error, type = "text" }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: "var(--olm-title)" }}>{label}</label>}
    <input type={type} value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
      style={{ fontFamily: "var(--font-sans)", fontSize: 14, padding: "11px 14px", borderRadius: 14,
        border: `1.5px solid ${error ? "var(--olm-error)" : "#E0DCE5"}`, background: "#fff", color: "var(--fg-2)", outline: "none" }} />
    {(help || error) && <div style={{ fontSize: 11, color: error ? "var(--olm-error)" : "var(--fg-3)" }}>{error || help}</div>}
  </div>
);

const Section = ({ background = "var(--olm-bg)", children, id, style }) => (
  <section id={id} style={{ background, padding: "96px 24px", ...style }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>{children}</div>
  </section>
);

const Eyebrow = ({ children, color = "var(--olm-primary)" }) => (
  <div style={{ fontSize: 13, fontWeight: 600, color, letterSpacing: "0.14em", textTransform: "uppercase" }}>{children}</div>
);

Object.assign(window, { Button, ArrowRight, Input, Section, Eyebrow });
