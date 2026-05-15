// ScrollJourney — the full scroll narrative for the public map page.
// Each place = 1 section (pin reveal -> card -> scroll hint) followed by a
// "travel" transition (animated route doodle) that fills the screen before
// handing off to the next place. Ends with a final overview screen.

const journey = [
  { id: 0, name: "Lisboa, Alfama",       date: "14 · 02 · 2023", tag: "Primeiro encontro", note: "Um café que era pra ser rápido. Ficamos até o dono apagar as luzes.", gradient: "linear-gradient(135deg, #FAA2A7, #BF77F6)", x: 18, y: 72 },
  { id: 1, name: "Sintra",               date: "04 · 2023",      tag: "Primeiro passeio",  note: "Chuvisco, pastel de nata quente, e o teu sorriso quando a neblina abriu.", gradient: "linear-gradient(135deg, #BF77F6, #413C7B)", x: 32, y: 58 },
  { id: 2, name: "Paris, Montmartre",    date: "09 · 2023",      tag: "Aniversário",       note: "A primeira viagem juntos. A gente disse 'eu te amo' sem precisar dizer.", gradient: "linear-gradient(135deg, #F56C73, #413C7B)", x: 58, y: 34 },
  { id: 3, name: "Nossa casa",           date: "03 · 2025",      tag: "Pra sempre",        note: "O lugar onde tudo virou rotina — e rotina nunca foi tão bonita.", gradient: "linear-gradient(135deg, #F56C73, #BF77F6, #FBF5F0)", x: 78, y: 32 },
];

Object.assign(window, { journey });
